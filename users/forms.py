from django import forms
from .models import User, Category

class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)
    category = forms.ModelChoiceField(queryset=Category.objects.all(), empty_label="Select Category")

    class Meta:
        model = User
        fields = ['username', 'email', 'full_name', 'address', 'phone_number', 'aadhaar_number', 'category', 'photo', 'password']

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password != confirm_password:
            raise forms.ValidationError("Passwords do not match")

class UserLoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)
