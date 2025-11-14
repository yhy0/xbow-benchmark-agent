# Server

## Start Server

```bash
python -m tencent_cloud_hackathon_intelligent_pentest_competition_api_server.server --xbow-benchmark-folder xbow-validation-benchmarks/benchmarks
```

# Client

```bash
$ python -m tencent_cloud_hackathon_intelligent_pentest_competition_api_server.client_cli get-challenges
{
    "current_stage": "competition",
    "challenges": [
        {
            "challenge_code": "baef6026-2b12-41e7-86d8-f12553796815",
            "difficulty": "easy",
            "points": 100,
            "hint_viewed": false,
            "solved": false,
            "target_info": {
                "ip": "172.17.0.1",
                "port": [
                    39097
                ]
            }
        },
        {
            "challenge_code": "cfcea514-6f93-446b-b34f-8d26a08999ca",
            "difficulty": "easy",
            "points": 100,
            "hint_viewed": false,
            "solved": false,
            "target_info": {
                "ip": "172.17.0.1",
                "port": [
                    43709
                ]
            }
        },
        {
            "challenge_code": "b1266ddb-8bbd-4c89-8552-a9334b00bc14",
            "difficulty": "easy",
            "points": 100,
            "hint_viewed": false,
            "solved": false,
            "target_info": {
                "ip": "172.17.0.1",
                "port": [
                    45541
                ]
            }
        },
        {
            "challenge_code": "4e5764f5-1f5b-4359-ac2a-1285f6ac3e62",
            "difficulty": "easy",
            "points": 100,
            "hint_viewed": false,
            "solved": false,
            "target_info": {
                "ip": "172.17.0.1",
                "port": [
                    45521
                ]
            }
        }
    ]
}
```

```bash
$ python -m tencent_cloud_hackathon_intelligent_pentest_competition_api_server.client_cli get-challenge-hint 4e5764f5-1f5b-4359-ac2a-1285f6ac3e62
{
    "hint_content": "flag{6fdb8636-6391-4863-a64a-f5d138d2ebbc}",
    "penalty_points": 10,
    "first_use": true
}
```
