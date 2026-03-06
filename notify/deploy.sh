#!/bin/bash
#
# Show Galaxy 部署脚本
# 用法：./deploy.sh [restart|status|logs]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="notify-system"
PORT=5001
LOG_FILE="/tmp/show-galaxy-deploy.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 检查必需文件
check_files() {
    log "🔍 检查必需文件..."
    
    local required_files=(
        "$SCRIPT_DIR/app.py"
        "$SCRIPT_DIR/templates/index.html"
        "$SCRIPT_DIR/templates/docs.html"
        "$SCRIPT_DIR/static/css/style-v2.css"
    )
    
    local missing=0
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "缺失文件：$file"
            missing=1
        else
            log "  ✓ $file"
        fi
    done
    
    if [ $missing -eq 1 ]; then
        error "部署检查失败，请检查缺失的文件"
        exit 1
    fi
    
    log "✅ 所有必需文件存在"
}

# 检查端口
check_port() {
    log "🔍 检查端口 $PORT..."
    if lsof -i :$PORT > /dev/null 2>&1; then
        warn "端口 $PORT 已被占用"
        return 1
    else
        log "  ✓ 端口 $PORT 可用"
        return 0
    fi
}

# 停止旧服务
stop_service() {
    log "🛑 停止旧服务..."
    
    # 尝试 systemctl
    if systemctl is-active --quiet $SERVICE_NAME 2>/dev/null; then
        systemctl stop $SERVICE_NAME
        log "  ✓ systemd 服务已停止"
    fi
    
    # 清理残留进程
    pkill -f "python3.*$SCRIPT_DIR.*app.py" 2>/dev/null || true
    
    sleep 1
    log "  ✓ 旧服务已清理"
}

# 启动服务
start_service() {
    log "🚀 启动服务..."
    
    # 使用 systemd
    if [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
        systemctl daemon-reload
        systemctl start $SERVICE_NAME
        sleep 2
        
        if systemctl is-active --quiet $SERVICE_NAME; then
            log "  ✓ systemd 服务已启动"
            return 0
        else
            error "systemd 服务启动失败"
            systemctl status $SERVICE_NAME --no-pager
            return 1
        fi
    else
        # 直接启动
        cd "$SCRIPT_DIR"
        nohup python3 app.py > /var/log/show-galaxy.log 2>&1 &
        sleep 2
        
        if pgrep -f "python3.*app.py" > /dev/null; then
            log "  ✓ 服务已启动 (PID: $(pgrep -f 'python3.*app.py'))"
            return 0
        else
            error "服务启动失败"
            cat /var/log/show-galaxy.log
            return 1
        fi
    fi
}

# 验证服务
verify_service() {
    log "🔍 验证服务..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:$PORT/api/health > /dev/null 2>&1; then
            log "  ✓ 健康检查通过"
            
            # 验证页面
            if curl -sf http://localhost:$PORT/ > /dev/null 2>&1; then
                log "  ✓ 主页可访问"
            else
                error "主页无法访问"
                return 1
            fi
            
            if curl -sf http://localhost:$PORT/docs > /dev/null 2>&1; then
                log "  ✓ 文档中心可访问"
            else
                error "文档中心无法访问"
                return 1
            fi
            
            log "✅ 服务验证通过"
            return 0
        fi
        
        warn "尝试 $attempt/$max_attempts - 服务尚未就绪..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    error "服务验证失败"
    return 1
}

# 主流程
main() {
    log "========================================"
    log "Show Galaxy 部署脚本"
    log "========================================"
    
    case "${1:-deploy}" in
        deploy|restart)
            check_files
            check_port || true
            stop_service
            start_service
            verify_service
            
            if [ $? -eq 0 ]; then
                log "========================================"
                log "✅ 部署成功!"
                log "访问地址：http://localhost:$PORT"
                log "日志：journalctl -u $SERVICE_NAME -f"
                log "========================================"
            else
                error "部署失败"
                exit 1
            fi
            ;;
        status)
            if systemctl is-active --quiet $SERVICE_NAME 2>/dev/null; then
                log "服务状态：运行中"
                systemctl status $SERVICE_NAME --no-pager
            else
                log "服务状态：未运行"
                pgrep -fa "python3.*app.py" || log "无相关进程"
            fi
            ;;
        logs)
            if [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
                journalctl -u $SERVICE_NAME -f
            else
                tail -f /var/log/show-galaxy.log
            fi
            ;;
        stop)
            stop_service
            log "服务已停止"
            ;;
        *)
            echo "用法：$0 [deploy|restart|status|logs|stop]"
            exit 1
            ;;
    esac
}

main "$@"
