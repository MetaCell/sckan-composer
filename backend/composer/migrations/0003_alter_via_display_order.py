# Generated by Django 4.1.4 on 2023-04-13 10:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0002_add_system_user"),
    ]

    operations = [
        migrations.AlterField(
            model_name="via",
            name="display_order",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
