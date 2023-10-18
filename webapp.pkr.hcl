packer {
  required_plugins {
    amazon = {
      version = ">= 0.1.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-06db4d78cb1d3bbf9"
}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "subnet_id" {
  type    = string
  default = "subnet-0e70e5264717e2b52"
}

source "amazon-ebs" "my-ami" {
  ami_name        = "csye6225_ami-${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "ami from csye6225"
  region          = var.aws_region

  ami_users = [
    "857650157256",
  ]

  ami_regions = [
    "us-east-1",
  ]

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  instance_type = "t2.micro"
  source_ami    = var.source_ami
  ssh_username  = var.ssh_username
  subnet_id     = var.subnet_id

  launch_block_device_mappings {
    device_name           = "/dev/xvda"
    delete_on_termination = true
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = [
    "source.amazon-ebs.my-ami",
  ]

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CHECKPOINT_DISABLE=1",
    ]

    inline = [
    "sudo apt-get update",
      "sudo apt-get install mariadb-server -y",
      "sudo systemctl start mariadb",
      "sudo mysql -e \"GRANT ALL ON . TO 'root'@'localhost' IDENTIFIED BY 'root2797';\"",
      "sudo apt install nodejs npm -y",
      "sudo apt install -y unzip",
    ]
  }
   provisioner "file" {
    source = "webapp.zip"
    destination = "~/"
  }

   provisioner "shell" {
    inline = [
      "echo webapp zip process",
      "sudo ls -al",
      "unzip webapp.zip -d webapp_ec2",
      "sudo ls -al",
      "cd webapp_ec2",
      "npm install",
      "npm install nodemon"
    ]
  }
}
