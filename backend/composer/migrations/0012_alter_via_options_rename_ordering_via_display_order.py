# Generated by Django 4.1.4 on 2023-01-28 12:43

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("composer", "0011_note_created"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="via",
            options={"ordering": ["display_order"], "verbose_name_plural": "Via"},
        ),
        migrations.RenameField(
            model_name="via",
            old_name="ordering",
            new_name="display_order",
        ),
    ]