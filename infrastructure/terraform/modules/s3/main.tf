# S3 Module for air.fun assets

# S3 Bucket for assets
resource "aws_s3_bucket" "assets" {
  bucket = var.bucket_name

  tags = {
    Name        = "${var.environment}-airfun-assets"
    Environment = var.environment
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# CloudFront Origin Access Identity (if CDN enabled)
resource "aws_cloudfront_origin_access_identity" "assets" {
  count   = var.enable_cdn ? 1 : 0
  comment = "OAI for ${var.environment} air.fun assets"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "assets" {
  count  = var.enable_cdn ? 1 : 0
  bucket = aws_s3_bucket.assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.assets[0].iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.assets.arn}/*"
      }
    ]
  })
}

# Outputs
output "bucket_id" {
  description = "S3 bucket ID"
  value       = aws_s3_bucket.assets.id
}

output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.assets.bucket
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.assets.arn
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.assets.bucket_regional_domain_name
}

output "cloudfront_oai_iam_arn" {
  description = "CloudFront OAI IAM ARN"
  value       = var.enable_cdn ? aws_cloudfront_origin_access_identity.assets[0].iam_arn : ""
}
