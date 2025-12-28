# Lambda function for image processing
resource "aws_lambda_function" "image_processor" {
  filename         = "lambda-deployment.zip"
  function_name    = "${var.project_name}-image-processor-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      THUMBNAILS_BUCKET = aws_s3_bucket.thumbnails.id
      DYNAMODB_TABLE    = aws_dynamodb_table.photos.name
    }
  }

  tags = {
    Name        = "Image Processor Lambda"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Log Group for Image Processor Lambda
resource "aws_cloudwatch_log_group" "image_processor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.image_processor.function_name}"
  retention_in_days = 7

  tags = {
    Name        = "Image Processor Lambda Logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda permission to allow S3 to invoke the function
resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.photos.arn
}

# S3 bucket notification to trigger Lambda
resource "aws_s3_bucket_notification" "photo_upload_notification" {
  bucket = aws_s3_bucket.photos.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = ""
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}
