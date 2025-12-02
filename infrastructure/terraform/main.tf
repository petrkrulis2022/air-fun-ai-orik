# Main Terraform configuration for air.fun AWS infrastructure

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  backend "s3" {
    bucket         = "airfun-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "airfun-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "air.fun"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# RDS PostgreSQL Module
module "rds" {
  source = "./modules/rds"

  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  db_instance_class     = var.db_instance_class
  db_allocated_storage  = var.db_allocated_storage
  backup_retention_days = var.backup_retention_days
}

# ElastiCache Redis Module
module "elasticache" {
  source = "./modules/elasticache"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_nodes
}

# S3 Bucket for thumbnails and assets
module "s3" {
  source = "./modules/s3"

  environment    = var.environment
  bucket_name    = var.s3_bucket_name
  enable_cdn     = true
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"

  environment       = var.environment
  s3_bucket_id      = module.s3.bucket_id
  s3_bucket_domain  = module.s3.bucket_domain_name
  domain_name       = var.domain_name
  certificate_arn   = var.acm_certificate_arn
}

# EC2 Application Tier
module "ec2" {
  source = "./modules/ec2"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_type      = var.ec2_instance_type
  min_size           = var.asg_min_size
  max_size           = var.asg_max_size
  desired_capacity   = var.asg_desired_capacity
  key_name           = var.ec2_key_name
  
  # Environment variables for application
  db_endpoint        = module.rds.endpoint
  redis_endpoint     = module.elasticache.endpoint
  s3_bucket_name     = module.s3.bucket_name
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for assets"
  value       = module.s3.bucket_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = module.cloudfront.domain_name
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.ec2.alb_dns_name
}
