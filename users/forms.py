from django import forms
from .models import User, Category

class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, required=True)
    confirm_password = forms.CharField(widget=forms.PasswordInput, required=True)
    
    # Explicitly define date widget for better UX
    dob = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), label="Date of Birth")
    course_start_date = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=False, label="Course Start Date (College)")
    course_end_date = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=False, label="Course End Date (College)")
    
    declaration = forms.BooleanField(
        required=True,
        label="I hereby declare that the information furnished above is true and correct. I undertake to abide by all rules, regulations, and instructions issued by the Stadium Management. I shall be responsible for maintaining discipline and for any damage caused to stadium property during the allotted period."
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'full_name', 'father_name', 'gender', 'dob', 'address', 'phone_number',
            'sports_discipline', 'aadhaar_number', 'photo',
            'is_student', 'student_type', 'school_college_name',
            'current_class', 'course_start_date', 'course_end_date', 'student_id_proof'
        ]
        help_texts = {
            'username': 'Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
        }

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        phone_number = cleaned_data.get("phone_number")
        aadhaar_number = cleaned_data.get("aadhaar_number")
        
        # Uniqueness Checks with Custom Messages
        if phone_number and User.objects.filter(phone_number=phone_number).exists():
            self.add_error('phone_number', "User with same mobile number already exists.")
            
        if aadhaar_number and User.objects.filter(aadhaar_number=aadhaar_number).exists():
            self.add_error('aadhaar_number', "User with this Aadhaar number already exists.")

        is_student = cleaned_data.get("is_student")
        student_type = cleaned_data.get("student_type")
        
        if password != confirm_password:
            self.add_error('confirm_password', "Passwords do not match")

        if is_student:
            if not student_type:
                self.add_error('student_type', "Please select Student Type (School/College).")
                
            if not cleaned_data.get('student_id_proof'):
                 self.add_error('student_id_proof', "Student ID Proof is required for students.")
                 
            if not cleaned_data.get('school_college_name'):
                self.add_error('school_college_name', "School/College Name is required.")

            if student_type == 'school':
                if not cleaned_data.get('current_class'):
                    self.add_error('current_class', "Current Class is required for School Students.")
            
            elif student_type == 'college':
                if not cleaned_data.get('course_start_date') or not cleaned_data.get('course_end_date'):
                     self.add_error('course_start_date', "Course Start and End dates are required for College Students.")
        
        return cleaned_data

class UserLoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)
