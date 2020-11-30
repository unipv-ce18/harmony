resource "aws_route53_zone" "zone" {
  name = var.site_name
}

resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.zone.zone_id
  name    = "api.${var.site_name}"
  type    = "A"

  alias {
    name                   = aws_lb.hy_api.dns_name
    zone_id                = aws_lb.hy_api.zone_id
    evaluate_target_health = false
  }
}

resource "aws_iam_server_certificate" "hy_cert" {
  name = "HySiteCertificate"
  path = "/cloudfront/"  # Necessary for it to be used by CloudFront in frontend

  certificate_body  = file(var.cert_file)
  certificate_chain = file(var.cert_chain)
  private_key       = file(var.cert_key)
}
