from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0010_brand_external_url_category_external_url_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="video",
            field=models.FileField(blank=True, null=True, upload_to="products/videos/"),
        ),
        migrations.AddField(
            model_name="product",
            name="video_external",
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
