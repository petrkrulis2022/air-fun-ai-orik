# air.fun Infrastructure

This directory contains infrastructure-as-code and monitoring configurations for air.fun.

## Directory Structure

```
infrastructure/
├── terraform/              # Terraform configurations for AWS
│   ├── main.tf            # Main Terraform configuration
│   ├── variables.tf       # Variable definitions
│   ├── modules/           # Terraform modules
│   │   ├── vpc/          # VPC and networking
│   │   ├── rds/          # PostgreSQL database
│   │   ├── elasticache/  # Redis cache
│   │   ├── s3/           # S3 storage
│   │   ├── cloudfront/   # CDN
│   │   └── ec2/          # EC2 Auto Scaling
│   └── ...
└── monitoring/            # Monitoring and alerting
    ├── prometheus.yml     # Prometheus configuration
    ├── alertmanager.yml   # Alert routing
    ├── grafana-dashboard.json  # Grafana dashboard
    └── docker-compose.monitoring.yml  # Monitoring stack
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Docker and Docker Compose (for local monitoring)

## Terraform Setup

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Create terraform.tfvars

Create a `terraform.tfvars` file with your configuration:

```hcl
aws_region = "us-east-1"
environment = "production"

# Database
db_password = "your-secure-password"
db_instance_class = "db.t3.medium"

# EC2
ec2_key_name = "your-key-pair-name"
asg_min_size = 2
asg_max_size = 10
asg_desired_capacity = 3

# Domain and SSL
domain_name = "cdn.air.fun"
acm_certificate_arn = "arn:aws:acm:..."
```

### 3. Plan and Apply

```bash
# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

## Monitoring Setup

### Local Monitoring Stack

Run the monitoring stack locally:

```bash
cd monitoring

# Set environment variables
export GRAFANA_ADMIN_PASSWORD=your-password
export DB_USER=airfun
export DB_PASSWORD=your-db-password
export DB_HOST=your-rds-endpoint
export REDIS_HOST=your-redis-endpoint

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
```

Access the services:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Alertmanager: http://localhost:9093

### Production Monitoring

In production, deploy the monitoring stack to EC2 instances or use AWS managed services:

1. **CloudWatch**: Automatically configured via Terraform
2. **Prometheus**: Deploy using the monitoring docker-compose file
3. **Grafana**: Configure with CloudWatch and Prometheus data sources

## CloudWatch Alarms

CloudWatch alarms are automatically created for:

- RDS CPU, storage, and connections
- ElastiCache CPU and memory
- ALB response time and error rates
- EC2 Auto Scaling metrics

Alerts are sent to the configured SNS topic and email.

## Grafana Dashboards

Import the provided dashboard:

1. Log in to Grafana
2. Go to Dashboards → Import
3. Upload `grafana-dashboard.json`

## PagerDuty Integration

Configure PagerDuty in `alertmanager.yml`:

```yaml
pagerduty_configs:
  - service_key: "your-pagerduty-service-key"
```

## Slack Integration

Configure Slack webhook in `alertmanager.yml`:

```yaml
slack_configs:
  - channel: "#alerts-critical"
    api_url: "your-slack-webhook-url"
```

## Maintenance

### Updating Infrastructure

```bash
cd terraform
terraform plan
terraform apply
```

### Scaling

Adjust Auto Scaling Group size:

```bash
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name production-airfun-asg \
  --desired-capacity 5
```

### Backup and Recovery

- **RDS**: Automated backups with 7-day retention
- **S3**: Versioning enabled with lifecycle policies
- **Terraform State**: Stored in S3 with DynamoDB locking

## Security

- All data encrypted at rest (RDS, S3, ElastiCache)
- TLS/SSL for data in transit
- Security groups restrict access
- IAM roles follow least privilege principle
- Secrets managed via AWS Secrets Manager or environment variables

## Cost Optimization

- Use Reserved Instances for predictable workloads
- Enable Auto Scaling to match demand
- Use S3 lifecycle policies for old data
- Monitor costs with AWS Cost Explorer

## Troubleshooting

### Check service health

```bash
# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check Auto Scaling Group
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names production-airfun-asg

# View CloudWatch logs
aws logs tail /aws/airfun/production/application --follow
```

### Access EC2 instances

```bash
# List instances
aws ec2 describe-instances \
  --filters "Name=tag:Environment,Values=production"

# SSH to instance (via bastion)
ssh -i your-key.pem ec2-user@<instance-ip>
```

## Support

For issues or questions, contact the DevOps team or create an issue in the repository.
