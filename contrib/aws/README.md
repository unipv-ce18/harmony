This directory holds [Terraform](https://terraform.io) configuration to deploy Harmony on AWS.

To make a deployment, create a `credentials` file in this folder holding `management` and `service` profiles like this:

```ini
# Where IAM users will be created
[management]
aws_access_key_id = ...
aws_secret_access_key = ...

# Where AWS resources will be allocated (e.g. an Educate account without IAM permissions)
[service]
aws_access_key_id = ...
aws_secret_access_key = ...
aws_session_token = ...
```

Then run `terraform init [dir]` and `terraform apply [dir]` where `[dir]` references one of the subsystems we used to
split billing over our (crippled) Educate accounts.

The subsystems are (apply in this order):

- **registry** configures ECR (docker image registry) and outputs credentials to be given to the CI pipeline;
- **storage** configures SNS, S3 and returns credentials to access object storage, which need to be passed to _compute_;
- **compute** sets up VPC networks, the ECS cluster, service and task definitions;
- **frontend** creates the S3 bucket, CloudFront distribution, Route 53 and S3 deploy credentials for CI.

As a last thing, manually create a SNS HTTPS subscription pointing to `https://api.hymusic.ga/_webhooks/s3/events`
(or your configured `site_name`), then search for the confirmation URL in CloudWatch inside `hy-apiserver`. 
