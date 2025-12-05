# GitHub Setup Guide for Beginners

## Step 1: Install Git on Your Computer

Git is the tool that manages your repository. GitHub is the website that hosts it online.

### For Mac:
1. Open Terminal (search for "Terminal" in Spotlight)
2. Type: `git --version` and press Enter
3. If it's not installed, macOS will prompt you to install it

### For Windows:
1. Download Git from: https://git-scm.com/download/win
2. Run the installer (use all default settings)

### For Linux:
```bash
sudo apt-get install git
```

## Step 2: Create a GitHub Account

1. Go to https://github.com
2. Click "Sign up"
3. Choose a username, enter your email, create a password
4. Verify your email

## Step 3: Configure Git (One-Time Setup)

Open your terminal/command prompt and run these commands:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

(Use the same email you signed up with on GitHub)

## Step 4: Create Your Repository

### Option A: On GitHub Website (Easier)

1. Log into GitHub
2. Click the "+" icon in the top-right corner
3. Select "New repository"
4. Fill in:
   - Repository name: `artifact-cms`
   - Description: "Multi-user Claude Artifact CMS"
   - Choose "Public" (or "Private" if you want only you to see it)
   - ✅ Check "Add a README file"
5. Click "Create repository"

### Option B: From Your Computer (More Direct)

We'll do this together in the next step!

## Step 5: Connect Your Code to GitHub

### Navigate to your project folder:

```bash
# First, go to where your artifact CMS files are
cd /path/to/artifact-cms-multiuser
```

### Initialize Git (makes it a repository):

```bash
git init
```

This creates a hidden `.git` folder that tracks changes.

### Add all your files:

```bash
git add .
```

The `.` means "all files in this folder"

### Create your first commit (save point):

```bash
git commit -m "Initial commit: Multi-user artifact CMS"
```

The `-m` is your message describing what changed.

### Connect to GitHub:

```bash
# Replace YOUR-USERNAME with your GitHub username
git remote add origin https://github.com/YOUR-USERNAME/artifact-cms.git
```

### Push (upload) to GitHub:

```bash
git branch -M main
git push -u origin main
```

You'll be asked for your GitHub username and password.
**Note:** For password, you need a "Personal Access Token" (see below)

## Step 6: Create a Personal Access Token

GitHub doesn't use your regular password for Git anymore. You need a token:

1. On GitHub, click your profile picture (top-right)
2. Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Click "Generate new token (classic)"
4. Give it a name: "Git Access"
5. Check the "repo" checkbox
6. Scroll down and click "Generate token"
7. **COPY THE TOKEN** - you won't see it again!
8. Use this token as your password when pushing code

## Daily Workflow (After Initial Setup)

### Making changes and saving them:

```bash
# 1. Check what changed
git status

# 2. Add the changes you want to save
git add .

# 3. Create a save point with a message
git commit -m "Added new feature: user profiles"

# 4. Upload to GitHub
git push
```

### Getting changes from GitHub (if working on multiple computers):

```bash
git pull
```

## Common Commands Cheat Sheet

```bash
git status              # See what files changed
git add filename.js     # Stage a specific file
git add .              # Stage all changes
git commit -m "message" # Save changes with a message
git push               # Upload to GitHub
git pull               # Download from GitHub
git log                # See history of changes
git clone URL          # Download a repository from GitHub
```

## Understanding the Workflow

Think of it like this:

1. **Working Directory** = Your actual files you're editing
2. **Staging Area** (git add) = Items in your shopping cart, ready to checkout
3. **Repository** (git commit) = Checked out items, saved permanently
4. **GitHub** (git push) = Your backup storage in the cloud

## Troubleshooting

### "Permission denied"
- Make sure you're using your Personal Access Token, not your password

### "Repository not found"
- Check the URL: `git remote -v`
- Make sure the repo exists on GitHub

### "Merge conflict"
- This happens when the same file was changed in two places
- Git will ask you to choose which version to keep

### "Nothing to commit"
- No files have changed since your last commit
- This is fine! Only commit when you've made changes

## Visual Tools (Optional)

If terminal commands feel overwhelming, try these apps:

- **GitHub Desktop**: https://desktop.github.com (official, beginner-friendly)
- **VS Code**: Built-in Git support with visual buttons
- **GitKraken**: Beautiful visual Git client

These let you click buttons instead of typing commands!

## Next Steps

Once your code is on GitHub:
- Share the URL with collaborators
- They can "clone" it to get a copy
- They can "fork" it to make their own version
- You can see all changes in the "Commits" tab
- Create "Issues" to track bugs or features

## Quick Start Script

Want to do it all at once? Here's a script:

```bash
# Navigate to your project
cd /mnt/user-data/outputs/artifact-cms-multiuser

# Initialize and commit
git init
git add .
git commit -m "Initial commit: Multi-user artifact CMS"

# Connect to GitHub (REPLACE YOUR-USERNAME!)
git remote add origin https://github.com/YOUR-USERNAME/artifact-cms.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Remember: Replace `YOUR-USERNAME` with your actual GitHub username!

## You're Ready! 🎉

That's it! You now know:
- ✅ What a repository is
- ✅ How to create one
- ✅ How to save your changes
- ✅ How to upload to GitHub

Git and GitHub have LOTS of advanced features, but these basics will get you 90% of the way there!
