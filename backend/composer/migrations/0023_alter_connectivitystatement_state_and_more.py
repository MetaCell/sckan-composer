# Generated by Django 4.1.4 on 2023-01-04 14:44

import django_fsm
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0022_alter_connectivitystatement_path_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="connectivitystatement",
            name="state",
            field=django_fsm.FSMField(default="draft", max_length=50, protected=True),
        ),
        migrations.AddConstraint(
            model_name="connectivitystatement",
            constraint=models.CheckConstraint(
                check=models.Q(
                    (
                        "state__in",
                        [
                            "draft",
                            "compose_now",
                            "curated",
                            "excluded",
                            "reviewed",
                            "connection_missing",
                            "npo_approved",
                            "approved",
                        ],
                    )
                ),
                name="state_valid",
            ),
        ),
    ]
