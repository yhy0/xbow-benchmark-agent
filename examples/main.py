from tencent_cloud_hackathon_intelligent_pentest_competition_api_server.client_sdk import APIClient

client = APIClient(
    base_url='http://127.0.0.1:8000',
    api_token='00000000-0000-0000-0000-000000000000',
)

challenges = client.get_challenges()
print(challenges)
first_challenge_code = challenges.challenges[0].challenge_code
print(client.get_challenge_hint(first_challenge_code))
print(client.submit_answer(first_challenge_code, 'flag{...}'))
