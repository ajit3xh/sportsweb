import os
import django
import shutil
from django.core.files import File

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from facilities.models import Facility

def attach_images():
    print("--- Attaching Images to Facilities ---")
    
    # Map Facility Name to Filename (substring match or exact)
    # Based on file listing:
    # Badminton: "29-01-33-1675023968-1675023969.jpg" (Looks like a generic sports img, assign to Badminton/Gym)
    # Table Tennis: "Ping-Pong-Paddles..."
    # Shooting: "Skeet_masculin..."
    # Carrom: "16695348f7c23b_mceclip6.png" (Guessing based on elimination or generic)
    # Judo: "Asa7Qf7DWxN..." (Guessing)
    # Taekwondo: "tfCDB7WeG-roxmiPl..."
    # Gym: "bN-mGGLZV..."
    
    # Let's try to map logically or just assign based on best guess since names are obscure.
    image_map = {
        'Table Tennis': 'Ping-Pong-Paddles-Table-Tennis-Paddles-Set-of-2-Paddles-and-3-Balls-Soft-Sponge-Rubber-Ideal-for-Professional-and-Recreational-Games_a5165bec-3cbd-4132-8118-88fa729ca973.8520de5a79f8cf531277d526d13d4c3e.avif',
        'Shooting': 'Skeet_masculin_aux_Jeux_olympiques_de_2024_-_Éric_Delaunay_(2).jpg',
        'Carrom': '16695348f7c23b_mceclip6.png', # Often board games have weird codes
        'Badminton': '29-01-33-1675023968-1675023969.jpg', # Generic court?
        'Judo': 'Asa7Qf7DWxN6gAS86icRO01oSsGrZ_yCltx-oWoiHusAA_kkuNoGhcXgdKjzYEpZDdtvwzwFkSijCzUW4aENeWLFXKMcCDbNMYJTUJblboo.jpeg',
        'Taekwondo': 'tfCDB7WeG-roxmiPlNk3EDwLN7Dyg_RBy6qXqLnGbJzPsupgkfJgPYqIbJ8TBllCgNuWSLkkuvZHLwK8ETwqdaYk6Svq88wlI-DQePqIFEY.jpeg',
        'Gym': 'bN-mGGLZVgppqaVdoVxBm0snMxvIoRoQYEZfyDwZQnhMLPG5fvISSLYRxYwst6gwZs0OAuxmjqchajBuljcPHp7_mhPpBq36I9jrr5RkDyE.jpeg'
    }

    base_dir = os.getcwd()
    
    for facility_name, filename in image_map.items():
        file_path = os.path.join(base_dir, filename)
        if os.path.exists(file_path):
            try:
                facility = Facility.objects.get(facility_name=facility_name)
                print(f"Found facility: {facility_name}. Attaching image...")
                
                # Copy to media if not already there or just open and save
                # Django's FileField will handle saving to media root
                with open(file_path, 'rb') as f:
                    facility.image.save(filename, File(f), save=True)
                    print(f"Attached {filename} to {facility_name}")
            except Facility.DoesNotExist:
                print(f"Skipping {facility_name}: Facility not found in DB.")
            except Exception as e:
                print(f"Error attaching to {facility_name}: {e}")
        else:
            print(f"File not found: {filename}")

    print("--- Image Attachment Complete ---")

if __name__ == '__main__':
    attach_images()
