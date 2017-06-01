# jason-doc-gen

JSON schema to HTML doc generator.

## Requirements

Node.js version 4 or later.

## Installation
```sh
git clone https://github.com/pasuslab/jason-doc-gen.git
cd jason-doc-gen
npm install
```

## Status
Work in progress.

## Usage

#### Single json conversion

node index.js _input-filename_ _[output-filename]_ _[options]_

#### Multiple json conversion

node index.js _input-path_ _[output-path]_ _[options]_

_If input-filename haven't '.json' extension it is managed as zip file, decompressed and converted in multiple json conversion mode._

Output folders will be created if not exists.

##### Available options

-h: Header file path (html format)<br>
-f: Footer file path (html format)<br>
-i: Index content file path (html format)<br>
-z: If input file has no extension, it's managed as zip file _(default: true)_<br>
-d: Directory deep level. If input is a zip, you can set how many directory bypass before check for files _(default: 1)_<br>
-c: Clear downloaded files. If true, downloaded files are deleted after conversion _(default: true)_<br>
-v: Verbose output _(default: true)_<br>

##### Github auto-push options
_If all git options are set, the converted files are automatically pushed on Github._

-gitrepository: Destination Github repository<br>
-gitbranch: Destination Github branch<br>
-gittoken: Guess it ;)<br>

### HTML templating
_There is a basic template tag system you can use in html files (header, footer end index content) to generate converted schemas index tree._

Tags:
* `<doctree-root>` Root index node
* `<doctree-branch-root>` 1st level folder node
* `<doctree-branch-label/>` 1st level folder name
* `<doctree-branch-root-childs>` 1st level childs node
* `<doctree-branch>` 2nd level folder node
* `<doctree-branch-label/>` 2nd level folder name
* `<doctree-branch-childs>` 2nd level childs node
* `<doctree-branch-leaf>` Leaf node (the json file)
* `<doctree-leaf-label/>` Leaf name (the json file name)
* `<doctree-leaf-uri/>` Realative converted file uri

Attributes:
* `${itemIndent}` Replaced by '_is-indent_' if the leaf is a 2nd level child
* `${itemLevel}` Item deep level (numeric)
* `${<doctree-leaf-uri/>.itemState}` Will be replaced by '_is-active_' if viewing the item page
