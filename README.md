# 腾讯云渗透测试大赛 Mock API Server

> 内部自研的竞赛 API 模拟器，用于在本地快速复现主办方的题目下发、提示以及答题流程，方便调试自动化攻防策略。

## 功能亮点
- **一键启动题目靶场**：从官方 `XBow` benchmark 目录动态复制题目，自动重映射端口并通过 Docker Compose 拉起靶场容器。
- **完全复刻 API 协议**：提供 `/api/v1/challenges`、`/api/v1/hint/{challenge_code}`、`/api/v1/answer` 等核心接口，返回结构与线上平台保持一致。
- **多端客户端**：内置 Typer CLI、SDK 以及 MCP（FastMCP）工具，支持脚本化调用与 AI Agent 联动。
- **安全日志与清理**：全链路结构化日志记录到 `logs/`，进程退出时自动关闭并清理所有靶场容器，避免资源泄露。

## 仓库结构
```
.
├─ challenges/                    # 运行期复制出的临时靶场，程序自动管理
├─ benchmarks/                    # 可选：挂载官方 benchmark 源目录
├─ tencent_cloud_hackathon_intelligent_pentest_competition_api_server/
│  ├─ server.py                   # FastAPI + Typer 主服务入口
│  ├─ client_cli.py              # 命令行客户端
│  ├─ client_sdk.py              # 重试/限流封装的 APIClient
│  ├─ client_mcp.py              # FastMCP 工具适配
│  ├─ utils/challenge.py         # Challenge 生命周期管理
│  └─ base.py                    # Pydantic 数据模型与枚举
├─ Dockerfile
├─ docker-compose.yaml
├─ pyproject.toml
└─ uv.lock
```

## 运行前准备
1. **Python 环境**：>= 3.12。推荐使用 [uv](https://github.com/astral-sh/uv) 或 `pipx` 管理虚拟环境。
2. **Docker & Docker Compose**：用于启动 benchmark 中的题目服务。
3. **官方 Benchmark 数据**：解压到任意目录（例如 `~/data/xbow-validation-benchmarks/benchmarks`），供 mock server 复制使用。
4. **可选：Redis**：`docker-compose.yaml` 里默认拉起一个 Redis，便于后续扩展评分或排队逻辑。

## 快速开始
### 方式一：本地运行（uv/pip）
```bash
git clone https://github.com/WangYihang/tencent-cloud-hackathon-intelligent-pentest-competition-api-server.git
cd tencent-cloud-hackathon-intelligent-pentest-competition-api-server

# 创建虚拟环境并安装依赖
uv venv
source .venv/bin/activate
uv pip sync

# 启动 API Server（示例：加载 1~4 号题目）
uv run python -m tencent_cloud_hackathon_intelligent_pentest_competition_api_server.server serve \
  --xbow-benchmark-folder ~/data/xbow-validation-benchmarks/benchmarks \
  --benchmark-ids 1 2 3 4 \
  --host 0.0.0.0 \
  --port 8000 \
  --public-accessible-host 127.0.0.1
```

启动后可访问：
- Swagger 文档：`http://127.0.0.1:8000/docs`
- 日志：`logs/competition-platform-server-logs.jsonl`

### 方式二：Docker Compose
```bash
docker compose up --build
```
默认会：
- 构建 `api-server` 镜像并挂载 `./benchmarks`、`./challenges`、`./logs`
- 暴露 `8000` 端口
- 同时拉起 `redis`（可在 `docker-compose.yaml` 中删除）

镜像入口已设置 `--xbow-benchmark-folder /app/benchmarks`，只需将 benchmark 数据同步到宿主机的 `./benchmarks` 目录即可。

## API 说明
| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| `GET` | `/api/v1/challenges` | 返回当前阶段（`debug/competition`）及所有题目实例的目标 IP、端口、积分等信息 |
| `GET` | `/api/v1/hint/{challenge_code}` | 查看题目提示内容，并在首次查看时记录罚分（默认 10%） |
| `POST` | `/api/v1/answer` | 校验选手提交的 flag，正确则返回积分并标记题目完成 |
| `GET` | `/` | 自动跳转到 `/docs` 方便调试 |

## 客户端工具
### CLI（Typer）
```bash
python -m tencent_cloud_hackathon_intelligent_pentest_competition_api_server.client_cli get-challenges
python -m ... client_cli get-challenge-hint <challenge_code>
python -m ... client_cli submit-answer <challenge_code> <flag>
```
客户端会读取以下环境变量（可写入 `.env`）：
```dotenv
COMPETITION_BASE_URL=http://127.0.0.1:8000
COMPETITION_API_TOKEN=00000000-0000-0000-0000-000000000000
```

### SDK
`client_sdk.APIClient` 支持：
- 每秒 1 次请求速率限制，防止误伤自建 API
- 指数退避 + 永不放弃的自动重试策略（适合长时间刷分脚本）
- 结构化请求/响应日志，便于回放

### MCP 工具
`python -m ... client_mcp` 可将 API 暴露给支持 MCP 协议的 Agent / IDE，方便与智能体联动。

## 运维与调试
- **Challenge 生命周期**：`ChallengeManager` 会在启动时为每个 benchmark 分配随机可用端口，并在进程退出或收到 `SIGINT/SIGTERM` 时自动 `docker compose down` + 删除临时目录。
- **日志**：所有服务与客户端日志均输出到 `logs/*.jsonl`，可直接使用 `jq`、`rich` 或 ELK 进一步分析。
- **手动清理**：若异常退出导致容器残留，可执行 `docker ps -a` 逐个关闭，或直接删除 `challenges/` 下的对应目录后重新启动。

## 常见问题
1. **健康检查失败**：`docker-compose.yaml` 的 `/health` 路由可改为 `/docs` 或自定义 FastAPI 路由。
2. **端口冲突**：ChallengeManager 会自动随机选取空闲端口；若仍冲突，可删除 `challenges/` 目录重新启动以重新分配。
3. **flag 读取失败**：确保 benchmark 内的 `.env` 文件中包含 `FLAG=`，否则 `Challenge.get_expected_answer()` 会抛出异常。

祝你在本地也能顺畅模拟赛题环境，加速策略调试与自动化攻防开发！如果有新需求（积分榜、Web 控制台等），欢迎继续迭代扩展。
