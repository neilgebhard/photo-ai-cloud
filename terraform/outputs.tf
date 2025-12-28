output "photos_bucket_name" {
  description = "Name of the S3 bucket for original photos"
  value       = aws_s3_bucket.photos.id
}

output "thumbnails_bucket_name" {
  description = "Name of the S3 bucket for thumbnails"
  value       = aws_s3_bucket.thumbnails.id
}

output "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for photo metadata"
  value       = aws_dynamodb_table.photos.name
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "api_gateway_url" {
  description = "Base URL of the API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}
