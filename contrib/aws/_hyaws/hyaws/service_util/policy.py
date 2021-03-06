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


def ecr_lifecycle_policy_image_count(max_images_count):
    return json.dumps({
        "rules": [
            {
                "rulePriority": 2,
                "description": "string",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": max_images_count
                },
                "action": {
                    "type": "expire"
                }
            }
        ]
    })


def ecr_repository_policy(name, account_ids, actions):
    return json.dumps({
        "Version": "2008-10-17",
        "Statement": [
            {
                "Sid": name,
                "Effect": "Allow",
                "Principal": {
                    "AWS": [f"arn:aws:iam::{id}:root" for id in account_ids]
                },
                "Action": actions
            }
        ]
    })
