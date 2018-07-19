Explicit Folding
===============

Manually controls how and where to fold your code

## Configuration

In your Settings
```
"editor.foldingStrategy": "explicit",
 
"explicitFolding.markers": {
    "comments": {
        "start": "\\/\\*\\*",
        "end": "\\*\\/"
    },
    "regions": {
        "start": "\\{\\{\\{",
        "end": "\\}\\}\\}"
    }
}

"[typescript]": {
    "explicitFolding.markers": {
        "regions": {
            "begin": "#region",
            "end": "#endregion"
        }
    }
}

"[javascriptreact]": {
    "explicitFolding.markers": {
        "regions": [
            {
                "begin": "\\{/\\*",
                "end": "\\*/\\}"
            },
            {
                "begin": "<",
                "end": "/>"
            }
        ]
    }
}
```

**Enjoy!**