packer {
  required_plugins {
    amazon = {
      version = ">= 0.1.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type = string

}

variable "source_ami" {
  type = string

}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "subnet_id" {
  type = string

}
variable "database_user" {
  type = string
}

variable "database_host" {
  type = string
}

variable "database_pass" {
  type = string
}

source "amazon-ebs" "my-ami" {
  ami_name        = "csye6225_ami-${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "ami from csye6225"
  region          = "${var.aws_region}"

  ami_users = [
    "857650157256",
  ]

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  instance_type = "t2.micro"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"

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
      "DATABASE_USER=${var.database_user}",
      "DATABASE_HOST=${var.database_host}",
      "DATABASE_PASS=${var.database_pass}"
    ]

    inline = [
      "sudo apt-get update",
      "sudo apt install nodejs npm -y",
      "sudo apt install -y unzip",
      "sudo groupadd csye6225_users",
      "sudo useradd -s /bin/false -g csye6225_users -d /opt/webapp -m csye6225_hinal",
      "sudo chown -R csye6225_hinal:csye6225_users /opt/webapp",
      "sudo chmod g+x /opt/webapp",
    ]

  }
  provisioner "file" {
    source      = "webapp.zip"
    destination = "~/"
  }
  provisioner "shell" {
    inline = [
      "echo webapp zip process",
      "sudo ls -al",
      "sudo cp webapp.zip /opt/webapp",
      "wget https://amazoncloudwatch-agent.s3.amazonaws.com/debian/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i -E ./amazon-cloudwatch-agent.deb",
      "cd /opt/webapp",
      "sudo unzip webapp.zip",
      "sudo mv user.csv /opt",
      "sudo mv webappSystemd.service /etc/systemd/system",
      "sudo npm install",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webappSystemd",
      "sudo systemctl start webappSystemd",
    ]


  }

}