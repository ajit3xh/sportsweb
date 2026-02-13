from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User, Membership, Category
from datetime import date

class Command(BaseCommand):
    help = 'Process student lifecycle: promote school students, expire college students'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Force promotion even if not April 30')

    def handle(self, *args, **options):
        today = timezone.now().date()
        self.stdout.write(f"Processing student lifecycle for {today}...")

        is_promotion_day = (today.month == 4 and today.day == 30)
        
        if is_promotion_day or options['force']:
            self.promote_school_students()
        else:
            self.stdout.write("Not promotion day (April 30). Skipping auto-promotion.")

        # 2. Check for expiry (College & School Class 12 completion)
        self.check_student_expiry()

    def promote_school_students(self):
        """
        Increments class for school students.
        If class > 12, they graduate to Normal User.
        """
        school_students = User.objects.filter(
            is_student=True, 
            student_type='school', 
            status='approved'
        )
        
        for student in school_students:
            if student.current_class:
                if student.current_class < 12:
                    student.current_class += 1
                    student.save()
                    self.stdout.write(f"Promoted {student.username} to class {student.current_class}")
                else:
                    # Completed Class 12
                    self.convert_to_individual(student, reason="Completed Class 12")

    def check_student_expiry(self):
        """
        Check if course ended (College) or if manually processed expiry is needed
        """
        # College Students
        expired_college_students = User.objects.filter(
            is_student=True,
            student_type='college',
            status='approved',
            course_end_date__lt=timezone.now().date()
        )
        
        for student in expired_college_students:
            self.convert_to_individual(student, reason=f"Course ended on {student.course_end_date}")

    def convert_to_individual(self, user, reason):
        """
        Downgrades a student to individual status
        """
        self.stdout.write(f"Converting {user.username} to Individual. Reason: {reason}")
        user.is_student = False
        user.student_type = None
        user.current_class = None
        user.save()
        
        # We might want to deactivate their student membership if strict, 
        # but requirements say: "If the membership is going on , keep it active but the next membership should show price of normal user membership."
        # So we just change their user status so next time they buy, they see individual prices.
