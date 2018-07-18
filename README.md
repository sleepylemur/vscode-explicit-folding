Explicit Folding
===============

**Experimental**

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

## Known Issues

- Can't support language specific configuration due to Microsoft/vscode#26707

**Enjoy!**