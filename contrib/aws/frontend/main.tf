terraform {
  backend "local" {
    path = "./.terraform/frontend.tfstate"
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

variable "site_name" {
  type = string
  default = "hymusic.ga"
}


# --- Deploy outputs ---

output "zone_nameservers" {
  value = data.aws_route53_zone.zone.name_servers
}

output "deploy_access_key" {
  value       = aws_iam_access_key.de_ak.id
  description = "aws_access_key_id to deploy the frontend"
}

output "deploy_secret_key" {
  value       = aws_iam_access_key.de_ak.secret
  description = "aws_secret_access_key to deploy the frontend"
  sensitive   = true
}
