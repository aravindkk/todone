1. Limit the number of all backend API calls to 50 per day per user. Beyond this, call out with a warning to the user that you have reached the limit for AI assistance for the day and that this will reset tomorrow. 
2. When the user uninstalls the chrome extension, show a exit survey with this link: https://docs.google.com/forms/d/e/1FAIpQLSekL8n8Z7lP9r-zIDw8piuvcqvEJP5y1RTf7AzkpB35eEpKsg/viewform?usp=publish-editor
3. Change the icon of the chrome extension to the file named "ExtensionLogo.png" both in the extension and on the new page where the title is shown.
4. Change the name of the chrome extension from Todone to Todo. Update everywhere.
5. Change the History view to show only bar charts for the last 7 days, showing tasks created, tasks completed. No task details are needed on this page. Show a one liner recap of the last 7 days in a warm, encouraging tone for the user.
6. Show a button to share rating for the extension after 3 days of usage, then 7 days of usage, then 14 days of usage and finally at 30 days of usage. The rating link is: https://chromewebstore.google.com/detail/adblock-plus-free-ad-bloc/cfhdojbkjhnklbpkdaibdccddilifddb/reviews?ref=store-rating
7. For each completed task, inline in the list view, it should show how time the task was open - time from task creation to task completion. Format this as 2 months or 25 days, 10 hours, 35 mins etc. depending on whether months or days or hours or minutes makes sense.
8. Randomly look at the user's open tasks and if anything looks bigger or open for long, ask "Who can help you with this task?", let user respond, store this for future reference. In future, if similar task is created by user, proactively ask user to reach out to the person mentioned by the user earlier. Similarly if a older task is finally completed, ask the user - What/Who helped you in closing this task? and record this reponse to help user in future for similar tasks. Store all of the users responses in a notes field for that task.
9. For each task, when user clicks on update a task, allow the user enter any notes for future reference. Store all of the users inputs in a notes field for that task. As a AI, you should be able to use this information in the future to suggest to user on what helped them for a similar task earlier. 
10. [Open] Find the system local time, and for the last 7 days, plot a chart of system local time and number of tasks created and number of tasks completed. Show this chart in the Streak view and show insights on what the user can learn from this.
11. Once in a couple of days, when user creates more than 10 items, show something like 
"Many of your tasks are related to XYZ, do you know anyone who can mentor you on this?" or "Who can guide you on these types of task?" etc.
12. [Open] Show an intro for the first time someone installs the extension that shows the principles of the extension: We recommend creating upto 5 tasks a day. More tasks adds to your stress levels.
13. Every time the user adds a task that becomes the sixth open task for the day, show a warning that "It's great to focus on only 5 tasks in a day. Do you still want to add this task?" The user can still proceed and create the task if they want.
14. Once the user completes the task, show them how much time they spent on the task(task completion time minus task creation time) in closest multiple of minutes or hours or days or months. Show a celebratory message and some confetti animation to celebrate it. If the task was long pending, ensure you appreciate more and show more celebration in the animation.
15. [Open] When user clicks on Focus mode, show a animation that the first task is what the focus mode is for. Right now, it is not clear to the user that the focus mode is for the first task.
16. Once there are three or more tasks for the day, show a prompt to the user to take a minute to re-arrange the tasks based on the priority order before they begin taking up the tasks.
17. Every day, for the first time in the day when the user sees the extension in their system local time, show a short summary of how yesterday was using language that is warm, encouraging and appreciative. Ignore weekends and use only weekdays to find the previous day.
18. Every Friday, show a nice summary as a modal highlighting what the user had accomplished. Keep it warm, encouraging and genuinely appreciative and show stats, top tasks, long pending tasks completed etc. Ask the user to rate the week with one of three smiley: sad, neutral, happy. Record this reaction in the local storage.
19. The following metrics and events should be instrumented cleanly:
New installs
Task addition against user id - no task description needed
Task completion against user id
Task deletion against user id
Task update against user id
Task moved to tomorrow against user id
Was User id active for the day?
20. Ensure the following metrics are computed on Google Analytics and shown clearly on some view:
Weekly Active Users - number of users who add/update/complete/delete a task in the last 7 days.
D7, D30 retention rate for users
Count of new users onboarded each day
Tasks completed per active user per week
Tasks added per active user per week
Average Number of Minutes spent by the user on the extension page