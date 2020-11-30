terraform {
  backend "local" {
    path = "./.terraform/registry.tfstate"
  }
}


# --- Accounts ---

provider "aws" {
  # Service account
  shared_credentials_file = "./credentials"
  profile                 = "service"
  region                  = var.deploy_region
}

provider "aws" {
  # Management account (aliased to mgmt, only requires IAM permissions)
  shared_credentials_file = "./credentials"
  profile                 = "management"
  region                  = "us-east-1" # IAM does not require region

  alias = "mgmt"
}


# --- Deploy inputs ---

variable "deploy_region" {
  type = string
}

variable "registry_max_image_count" {
  type    = number
  default = 5
}

variable "registry_pull_accounts" {
  type = list(string)
  default = [
    "arn:aws:iam::557561060937:root" # Todareaux
  ]
}


# --- Deploy outputs ---

output "registry_access_key" {
  value       = aws_iam_access_key.re_ak.id
  description = "aws_access_key_id to push images"
}

output "registry_secret_key" {
  value       = aws_iam_access_key.re_ak.secret
  description = "aws_secret_access_key to push images"
  sensitive   = true
}
