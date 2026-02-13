
content = r"""{% extends 'base.html' %}
{% load static %}

{% block content %}
<div class="min-h-screen bg-light dark:bg-dark py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden fade-in-up">
            <!-- Header/Cover -->
            <div class="h-32 bg-gradient-to-r from-primary to-blue-600 relative">
                <div class="absolute -bottom-16 left-8">
                    <div class="w-32 h-32 rounded-full bg-white dark:bg-slate-700 p-1 shadow-lg">
                        <div class="w-full h-full rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-4xl font-bold text-slate-500 dark:text-slate-300">{{ user.full_name|slice:":1" }}</div>
                    </div>
                </div>
            </div>

            <div class="pt-20 pb-8 px-8">
                <!-- User Info Header -->
                <div class="flex justify-between items-start mb-10">
                    <div>
                        <h1 class="text-3xl font-extrabold text-dark dark:text-white">{{ user.full_name }}</h1>
                        <p class="text-slate-500 dark:text-slate-400">{{ user.email }}</p>
                        <div class="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary text-sm font-bold">{{ user.category.name|default:"General User" }}</div>
                    </div>
                    <a href="{% url 'users:settings' %}" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Edit Profile
                    </a>
                </div>

                <!-- Membership Section (Full Width) -->
                <div class="mb-8">
                    <h3 class="text-lg font-bold text-dark dark:text-white mb-4">Membership Status</h3>
                    {% if active_membership and active_membership.is_valid %}
                    <div class="bg-gradient-to-r from-secondary to-green-600 rounded-2xl shadow-xl p-8 text-white fade-in-up">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-green-100 text-sm">Active Membership</p>
                                    <h2 class="text-3xl font-black">{{ active_membership.membership_tier.display_duration }}</h2>
                                    <p class="text-green-100 mt-1">Valid until {{ active_membership.end_date|date:"F d, Y" }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="bg-white/20 rounded-xl px-4 py-2">
                                    <p class="text-3xl font-black">{{ days_remaining }}</p>
                                    <p class="text-green-100 text-sm">days left</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {% else %}
                    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 fade-in-up">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </div>
                            <div class="flex-grow">
                                <h3 class="text-lg font-bold text-dark dark:text-white">No Active Membership</h3>
                                <p class="text-slate-500 dark:text-slate-400 text-sm">Purchase a membership to start booking facilities</p>
                            </div>
                            <a href="{% url 'tariff' %}" class="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                Get Membership
                            </a>
                        </div>
                    </div>
                    {% endif %}
                </div>

                <!-- Stats Grid -->
                <div>
                    <h3 class="text-lg font-bold text-dark dark:text-white mb-4">Account Overview</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up" style="animation-delay: 0.1s;">
                        <!-- Total Bookings -->
                        <div class="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div class="relative z-10">
                                <p class="text-blue-100 text-sm font-medium">Total Bookings</p>
                                <h3 class="text-4xl font-bold mt-1">{{ total_bookings }}</h3>
                            </div>
                            <div class="absolute right-0 bottom-0 opacity-10">
                                <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-1V1m-1 11h-5v5h5v-5z"></path>
                                </svg>
                            </div>
                        </div>

                        <!-- Status -->
                        <div class="bg-white dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <div class="relative z-10">
                                <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Account Status</p>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                                    <h3 class="text-2xl font-bold text-dark dark:text-white">Active</h3>
                                </div>
                            </div>
                        </div>

                        <!-- Member Since -->
                        <div class="bg-white dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <div class="relative z-10">
                                <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">Member Since</p>
                                <h3 class="text-2xl font-bold text-dark dark:text-white mt-1">{{ user.date_joined|date:"F Y" }}</h3>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>
</div>
{% endblock %}
"""

import os

file_path = r'c:\Users\ajite\Desktop\sportsweb\templates\users\profile.html'

try:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully wrote clean content to {file_path}")
except Exception as e:
    print(f"Error writing file: {e}")
