from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sellers", "0009_seller_banner2_external_seller_banner3_external_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="seller",
            name="person_type",
            field=models.CharField(
                choices=[("PF", "Pessoa Física"), ("PJ", "Pessoa Jurídica")],
                default="PF",
                max_length=2,
            ),
        ),
        migrations.AddField(
            model_name="seller",
            name="cpf_cnpj",
            field=models.CharField(
                blank=True,
                help_text="Somente dígitos. CPF (PF) ou CNPJ (PJ).",
                max_length=18,
            ),
        ),
    ]
