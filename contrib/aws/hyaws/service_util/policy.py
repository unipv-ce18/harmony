import json


def account_trust_relationship_policy(account_id):
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{account_id}:root"
                },
                "Action": "sts:AssumeRole",
                "Condition": {}
            }
        ]
    })


def assume_role_policy(role_arn):
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "sts:AssumeRole",
                "Resource": role_arn
            }
        ]
    })
