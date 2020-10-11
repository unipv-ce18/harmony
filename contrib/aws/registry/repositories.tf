resource "aws_ecr_repository" "repo_apiserver" {
  name = "harmony/apiserver"
}

resource "aws_ecr_repository_policy" "repo_apiserver" {
  repository = aws_ecr_repository.repo_apiserver.name
  policy     = data.aws_iam_policy_document.repo_permission_policy.json
}

resource "aws_ecr_lifecycle_policy" "repo_apiserver" {
  repository = aws_ecr_repository.repo_apiserver.name
  policy     = local.repo_lifecycle_policy
}


resource "aws_ecr_repository" "repo_director" {
  name = "harmony/director"
}

resource "aws_ecr_repository_policy" "repo_director" {
  repository = aws_ecr_repository.repo_director.name
  policy     = data.aws_iam_policy_document.repo_permission_policy.json
}

resource "aws_ecr_lifecycle_policy" "repo_director" {
  repository = aws_ecr_repository.repo_director.name
  policy     = local.repo_lifecycle_policy
}


resource "aws_ecr_repository" "repo_worker" {
  name = "harmony/worker"
}

resource "aws_ecr_repository_policy" "repo_worker" {
  repository = aws_ecr_repository.repo_worker.name
  policy     = data.aws_iam_policy_document.repo_permission_policy.json
}

resource "aws_ecr_lifecycle_policy" "repo_worker" {
  repository = aws_ecr_repository.repo_worker.name
  policy     = local.repo_lifecycle_policy
}


data "aws_iam_policy_document" "repo_permission_policy" {
  statement {
    sid    = "Allow pull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer"
    ]
    principals {
      type        = "AWS"
      identifiers = var.registry_pull_accounts
    }
  }
}

locals {
  repo_lifecycle_policy = jsonencode({
    rules = [
      {
        action       = { type = "expire" }
        description  = "string"
        rulePriority = 2
        selection = {
          countNumber = var.registry_max_image_count
          countType   = "imageCountMoreThan"
          tagStatus   = "any"
        }
      }
    ]
  })
}
