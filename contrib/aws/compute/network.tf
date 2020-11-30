resource "aws_vpc" "hy" {
  cidr_block = "10.0.0.0/16"
  #enable_dns_hostnames = true

  tags = { Name = "Harmony network" }
}


resource "aws_main_route_table_association" "hy" {
  vpc_id         = aws_vpc.hy.id
  route_table_id = aws_route_table.hy_private.id
}


resource "aws_route_table" "hy_public" {
  vpc_id = aws_vpc.hy.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.hy.id
  }

  tags = { Name = "HY public route table" }
}

resource "aws_route_table" "hy_private" {
  vpc_id = aws_vpc.hy.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.workers_nat.id
  }

  tags = { Name = "HY private route table" }
}


resource "aws_subnet" "hy_public_1" {
  availability_zone_id = "use1-az2"
  cidr_block           = "10.0.0.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "Harmony subnet (public #1)" }
}

resource "aws_route_table_association" "hy_public_1" {
  subnet_id      = aws_subnet.hy_public_1.id
  route_table_id = aws_route_table.hy_public.id
}

resource "aws_subnet" "hy_public_2" {
  availability_zone_id = "use1-az4"
  cidr_block           = "10.0.1.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "Harmony subnet (public #2)" }
}

resource "aws_route_table_association" "hy_public_2" {
  subnet_id      = aws_subnet.hy_public_2.id
  route_table_id = aws_route_table.hy_public.id
}


resource "aws_subnet" "hy_private" {
  availability_zone_id = "use1-az2"
  cidr_block           = "10.0.8.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "Harmony subnet (private)" }
}


resource "aws_internet_gateway" "hy" {
  vpc_id = aws_vpc.hy.id

  tags = { Name = "HY internet gateway" }
}

resource "aws_eip" "workers_nat" {
  tags = { Name = "HY workers EIP" }
}

resource "aws_nat_gateway" "workers_nat" {
  allocation_id = aws_eip.workers_nat.id
  subnet_id     = aws_subnet.hy_public_1.id

  tags = { Name = "HY workers NAT" }
}


resource "aws_security_group" "allow_http" {
  name        = "allow-http"
  description = "Allow HTTP inbound traffic"
  vpc_id      = aws_vpc.hy.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "Allow HTTP in" }
}

resource "aws_security_group" "allow_https" {
  name        = "allow-https"
  description = "Allow HTTPS inbound traffic"
  vpc_id      = aws_vpc.hy.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "Allow HTTPS in" }
}

resource "aws_security_group" "allow_all_outbound" {
  name        = "allow-all-outbound"
  description = "Allow all outbound traffic"
  vpc_id      = aws_vpc.hy.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "Allow all out" }
}
