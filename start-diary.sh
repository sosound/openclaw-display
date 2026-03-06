#!/bin/bash
# Growth Diary 启动脚本
# 确保从正确的目录启动 Flask 应用

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}/growth-diary"
PID_FILE="${SCRIPT_DIR}/growth-diary.pid"
LOG_FILE="${SCRIPT_DIR}/growth-diary.log"

cd "${APP_DIR}"

# 检查是否已在运行
if [ -f "${PID_FILE}" ]; then
    OLD_PID=$(cat "${PID_FILE}")
    if kill -0 "${OLD_PID}" 2>/dev/null; then
        echo "Growth Diary 已在运行 (PID: ${OLD_PID})"
        exit 0
    else
        echo "清理旧的 PID 文件"
        rm -f "${PID_FILE}"
    fi
fi

# 启动应用
echo "启动 Growth Diary..."
nohup python3 app.py > "${LOG_FILE}" 2>&1 &
NEW_PID=$!
echo ${NEW_PID} > "${PID_FILE}"
echo "Growth Diary 已启动 (PID: ${NEW_PID})"
echo "日志：${LOG_FILE}"
