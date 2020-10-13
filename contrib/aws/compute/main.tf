terraform {
  backend "local" {
    path = "./compute.tfstate"
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

variable "task_count_apiserver" {
  type = number
  default = 0
}

variable "storage_access_key" {
  type = string
}

variable "storage_secret_key" {
  type = string
}

variable "db_user" {
  type = string
}

variable "db_pass" {
  type = string
}


variable "amqp_user" {
  type = string
}

variable "amqp_pass" {
  type = string
}


# --- Data sources ---

data "aws_caller_identity" "current" {}
