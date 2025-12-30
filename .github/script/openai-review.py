import os
import openai
import requests

# openai.api_key = os.environ["OPENAI_API_KEY"]
client = openai.OpenAI(
    api_key = os.environ["OPENAI_API_KEY"]
)

def get_diff():
    """Get PR diff"""
    repo = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ["PR_NUMBER"]
    headers = {
        "Authorization": f"token {os.environ['GITHUB_TOKEN']}",
        "Accept": "application/vnd.github.v3.diff"
    }
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.text

def generate_review(diff_text):
    """Generate Code Review With OpenAI"""
    prompt = f"""
        ```diff
        {diff_text[:4000]}
        ```
    """
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a code reviewer. Please review the following PR diff by considering code quality, readability, and potential bugs. Focus on providing constructive and essential feedback in KOREAN. Avoid small, trivial suggestions and instead, focus on key improvements or issues."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def post_comment(review_text):
    """Comment GitHub PR"""
    repo = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ["PR_NUMBER"]
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    headers = {
        "Authorization": f"token {os.environ['GITHUB_TOKEN']}",
        "Accept": "application/vnd.github+json"
    }
    response = requests.post(url, json={"body": review_text}, headers=headers)
    response.raise_for_status()

def main():
    print("🔍 Diff 가져오는 중...")
    diff = get_diff()
    print("🤖 OpenAI로 리뷰 생성 중...")
    review = generate_review(diff)
    print("💬 PR에 댓글 작성 중...")
    post_comment(review)
    print("✅ 완료!")

if __name__ == "__main__":
    main()