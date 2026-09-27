# open

## Syntax:
`open {path} as {file} for reading/writing/appending`
## Example:
`file File1`  
`file File2`  
`file File3`

``open `oldvalues.txt` as File1 for reading``  
``open `newvalues.txt` as File2 for writing``  
`read Value from File1`  
`write Value to File2`  
`close File2`  
`close File1`

``open `somefile.txt` as File3 for appending``  
``write `some data` to File3``  
`close File3`

## Description:
Opens a disk file for reading, writing or appending. Each of the [file](file.md) variables must be declared as such as in the example.

Next: [pass](pass.md)  
Prev: [on](on.md)

[Back](../../README.md)
