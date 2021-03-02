# --- Project VPC ---

resource "aws_vpc" "hy" {
  cidr_block = "10.0.0.0/16"
  #enable_dns_hostnames = true

  tags = { Name = "Harmony network" }
}

resource "aws_main_route_table_association" "hy" {
  vpc_id         = aws_vpc.hy.id
  route_table_id = aws_route_table.hy_public.id
}


# --- Route Tables ---

resource "aws_route_table" "hy_public" {
  vpc_id = aws_vpc.hy.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.hy.id
  }

  tags = { Name = "HY public" }
}

resource "aws_route_table" "hy_private_1" {
  count = var.task_count_director > 0 ? 1 : 0

  vpc_id = aws_vpc.hy.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.workers_nat_1[0].id
  }

  tags = { Name = "HY private #1" }
}

resource "aws_route_table" "hy_private_2" {
  count = var.task_count_director > 0 ? 1 : 0

  vpc_id = aws_vpc.hy.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.workers_nat_2[0].id
  }

  tags = { Name = "HY private #2" }
}


# --- Subnets ---

resource "aws_subnet" "hy_public_1" {
  availability_zone_id = "use1-az2"
  cidr_block           = "10.0.0.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "HY public #1" }
}

resource "aws_route_table_association" "hy_public_1" {
  subnet_id      = aws_subnet.hy_public_1.id
  route_table_id = aws_route_table.hy_public.id
}

resource "aws_subnet" "hy_public_2" {
  availability_zone_id = "use1-az4"
  cidr_block           = "10.0.1.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "HY public #2" }
}

resource "aws_route_table_association" "hy_public_2" {
  subnet_id      = aws_subnet.hy_public_2.id
  route_table_id = aws_route_table.hy_public.id
}


resource "aws_subnet" "hy_private_1a" {
  availability_zone_id = "use1-az2"
  cidr_block           = "10.0.8.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "Harmony private #1 (API)" }
}

resource "aws_route_table_association" "hy_private_1a" {
  count = var.task_count_director > 0 ? 1 : 0

  subnet_id      = aws_subnet.hy_private_1a.id
  route_table_id = aws_route_table.hy_private_1[0].id
}

resource "aws_subnet" "hy_private_1w" {
  availability_zone_id = "use1-az2"
  cidr_block           = "10.0.9.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "Harmony private #1 (Workers)" }
}

resource "aws_route_table_association" "hy_private_1w" {
  count = var.task_count_director > 0 ? 1 : 0

  subnet_id      = aws_subnet.hy_private_1w.id
  route_table_id = aws_route_table.hy_private_1[0].id
}

resource "aws_subnet" "hy_private_2a" {
  availability_zone_id = "use1-az4"
  cidr_block           = "10.0.10.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "Harmony private #2 (API)" }
}

resource "aws_route_table_association" "hy_private_2a" {
  count = var.task_count_director > 0 ? 1 : 0

  subnet_id      = aws_subnet.hy_private_2a.id
  route_table_id = aws_route_table.hy_private_2[0].id
}

resource "aws_subnet" "hy_private_2w" {
  availability_zone_id = "use1-az4"
  cidr_block           = "10.0.11.0/24"
  vpc_id               = aws_vpc.hy.id

  tags = { Name = "Harmony private #2 (Workers)" }
}

resource "aws_route_table_association" "hy_private_2w" {
  count = var.task_count_director > 0 ? 1 : 0

  subnet_id      = aws_subnet.hy_private_2w.id
  route_table_id = aws_route_table.hy_private_2[0].id
}


# --- Gateway & NATs ---

resource "aws_internet_gateway" "hy" {
  vpc_id = aws_vpc.hy.id

  tags = { Name = "HY internet gateway" }
}

resource "aws_eip" "workers_nat_1" {
  tags = { Name = "HY workers EIP" }
}

resource "aws_nat_gateway" "workers_nat_1" {
  count = var.task_count_director > 0 ? 1 : 0

  allocation_id = aws_eip.workers_nat_1.id
  subnet_id     = aws_subnet.hy_public_1.id

  tags = { Name = "HY workers NAT #1" }
}

resource "aws_eip" "workers_nat_2" {
  tags = { Name = "HY workers EIP" }
}

resource "aws_nat_gateway" "workers_nat_2" {
  count = var.task_count_director > 0 ? 1 : 0

  allocation_id = aws_eip.workers_nat_2.id
  subnet_id     = aws_subnet.hy_public_2.id

  tags = { Name = "HY workers NAT #2" }
}


# --- Security Groups ---

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
