terraform {
  backend "local" {
    path = "./frontend.tfstate"
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
  default = "hymusic.tk"
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


# --- Deploy outputs ---

output "zone_nameservers" {
  value = aws_route53_zone.zone.name_servers
}
