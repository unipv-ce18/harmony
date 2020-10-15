resource "aws_route53_zone" "zone" {
  name = var.site_name
}

resource "aws_route53_record" "default" {
  zone_id = aws_route53_zone.zone.zone_id
  name    = var.site_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.webapp.domain_name
    zone_id                = aws_cloudfront_distribution.webapp.hosted_zone_id
    evaluate_target_health = false
  }
}
