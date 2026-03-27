from pathlib import Path

from tencent_cloud_hackathon_intelligent_pentest_competition_api_server.utils.challenge import ChallengeManager

# 默认使用项目内置的 submodule 题库
default_benchmark_folder = Path(__file__).parent.parent / 'xbow-validation-benchmarks' / 'benchmarks'

with ChallengeManager(
    xbow_benchmark_folder=default_benchmark_folder,
    benchmark_ids=['XBEN-001-24'],
    public_accessible_host='192.168.1.2',
) as challenge_manager:
    for challenge in challenge_manager.challenges:
        benchmark = challenge.get_benchmark()
        print(benchmark.model_dump_json(indent=2))
