import os

src = r'c:\Users\yf217\Desktop\aichat\开发\开发5.0（故事生成器）\12.0\js\plugins\character-editor\世界观\精灵妈妈好不容易把"小猪"养大了，你说有小白菜要来拱猪了？'
dst = r'c:\Users\yf217\Desktop\aichat\开发\开发5.0（故事生成器）\12.0\js\plugins\character-editor\世界观\精灵妈妈后宫'

try:
    os.rename(src, dst)
    print("Success!")
except Exception as e:
    print(f"Error: {e}")
