terraform {
  backend "local" {
    path = "./.terraform/storage.tfstate"
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

variable "storage_bucket_songs_reference" {
  type    = string
  default = "hy-lossless-songs"
}

variable "storage_bucket_songs_transcoded" {
  type    = string
  default = "hy-compressed-songs"
}

variable "storage_bucket_songs_bundles" {
  type    = string
  default = "hy-modified-songs"
}

variable "storage_bucket_images" {
  type    = string
  default = "hy-images"
}


# --- Data sources ---

data "aws_caller_identity" "current" {}


# --- Deploy outputs ---

output "storage_access_key" {
  value       = aws_iam_access_key.st_ak.id
  description = "aws_access_key_id to access storage"
}

output "storage_secret_key" {
  value       = aws_iam_access_key.st_ak.secret
  description = "aws_secret_access_key to access storage"
  sensitive   = true
}
