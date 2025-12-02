variable "environment" {
  description = "Environment name"
  type        = string
}

variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "enable_cdn" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = true
}
