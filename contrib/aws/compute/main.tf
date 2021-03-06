terraform {
  backend "local" {
    path = "./.terraform/compute.tfstate"
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

variable "task_count_apiserver" {
  type = number
  default = 0
}

variable "task_count_director" {
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

variable "cert_file" {
  type = string
}

variable "cert_key" {
  type = string
}

variable "cert_chain" {
  type = string
  default = ""
}


# --- Data sources ---

data "aws_caller_identity" "current" {}
