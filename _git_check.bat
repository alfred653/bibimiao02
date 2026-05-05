@echo off
cd /d D:\Coding\bibimiao02
git status > D:\Coding\bibimiao02\_git_status.txt 2>&1
git log --oneline -3 > D:\Coding\bibimiao02\_git_log.txt 2>&1
