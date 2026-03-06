#!/bin/bash
#
# GitHub 子代理身份配置脚本
# 用法：./github-agent-config.sh <agent-id>
#

set -e

AGENTS=(
  "11:十一 (Eleven):eleven@openclaw.local"
  "12:十二 (Twelve):twelve@openclaw.local"
  "13:十三 (Code):thirteen@openclaw.local"
  "14:十四 (System):fourteen@openclaw.local"
)

show_agents() {
  echo "可用的子代理身份："
  echo ""
  for agent in "${AGENTS[@]}"; do
    id=$(echo $agent | cut -d: -f1)
    name=$(echo $agent | cut -d: -f2)
    email=$(echo $agent | cut -d: -f3)
    echo "  $id - $name <$email>"
  done
  echo ""
}

config_agent() {
  local id=$1
  local found=false
  
  for agent in "${AGENTS[@]}"; do
    agent_id=$(echo $agent | cut -d: -f1)
    if [ "$agent_id" == "$id" ]; then
      name=$(echo $agent | cut -d: -f2)
      email=$(echo $agent | cut -d: -f3)
      
      echo "配置子代理 #$id 的 Git 身份..."
      git config user.name "$name"
      git config user.email "$email"
      
      echo "✅ 配置完成："
      echo "   用户名：$(git config user.name)"
      echo "   邮箱：$(git config user.email)"
      echo ""
      found=true
      break
    fi
  done
  
  if [ "$found" == "false" ]; then
    echo "❌ 未找到子代理 #$id"
    echo ""
    show_agents
    exit 1
  fi
}

# 主程序
if [ -z "$1" ]; then
  echo "用法：$0 <agent-id>"
  echo ""
  show_agents
  echo "示例："
  echo "  $0 11  # 配置为十一的身份"
  echo "  $0 13  # 配置为十三的身份"
  exit 1
fi

config_agent "$1"
