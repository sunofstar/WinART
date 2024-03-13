Description: All Execute Command
Author: ParkSeongJae
Version: 1
Id: ab13eb5f-31db-5cdc-83df-88ec12dc1a
Keys:
    -
        Description: XP Search – ACMRU
        HiveType: NtUser
        Category: File Knowledge
        KeyPath: NTUSER.DAT\Software\Microsoft\Search Assistant\ACMru
        Recursive: true
        Comment: "XP Search – ACMRU"
    -
        Description: Explorer WordWheelQuery
        HiveType: NtUser
        Category: Deleted File or File Knowledge
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\WordWheelQuery
        Recursive: false
        Comment: "Explorer WordWheelQuery"
    -
        Description: OpenSavePidlMRU
        HiveType: NTUSER
        Category: Deleted File
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\ComDlg32\OpenSavePidlMRU
        Recursive: false
        Comment: "OpenSavePidlMRU"
    -
        Description: DeviceContainers
        HiveType: SYSTEM
        Category: DeviceContainers
        KeyPath: ControlSet001\Control\DeviceContainers
        Recursive: true
        Comment: "DeviceContainers"
    -
        Description: DeviceClasses
        HiveType: SYSTEM
        Category: DeviceClasses
        KeyPath: ControlSet001\Control\DeviceClasses
        Recursive: true
        Comment: "DeviceClasses"
    -
        Description: Key Identification
        HiveType: SYSTEM
        Category: USBSTOR
        KeyPath: ControlSet001\Enum
        Recursive: true
        Comment: "Key Identification"
    -
        Description: User
        HiveType: NTUSER
        Category: DeviceClasses
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\MountPoints2
        Recursive: true
        Comment: "User"
    -
        Description: OpenSavePidlMRU
        HiveType: NTUSER
        Category: File Download
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\ComDlg32\OpenSavePidlMRU
        Recursive: true
        Comment: "OpenSavePidlMRU"
    -
        Description: OpenSavePidlMRU
        HiveType: NTUSER
        Category: File Access and Opening
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\ComDlg32\OpenSavePidlMRU
        Recursive: true
        Comment: "OpenSavePidlMRU"
    -
        Description: RecentDocs
        HiveType: NTUSER
        Category: File Access and Opening
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs
        Recursive: true
        Comment: "RecentDocs"
    -
        Description: Shell Bags
        HiveType: UsrClass
        Category: File Access and Opening
        KeyPath: Local Settings\Software\Microsoft\Windows\Shell
        Recursive: true
        Comment: "Shell Bags"
    -
        Description: Shell Bags
        HiveType: NTUSER
        Category: File Access and Opening
        KeyPath: Software\Microsoft\Windows\Shell
        Recursive: true
        Comment: "Shell Bags"
    -
        Description: LastVisitedPidlMRU
        HiveType: NTUSER
        Category: File Access and Opening
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\ComDlg32\LastVisitedPidlMRU
        Recursive: false
        Comment: "LastVisitedPidlMRU"
    -
        Description: MS Office MRU
        HiveType: NTUSER
        Category: File and Folder Opening
        KeyPath: SOFTWARE\Microsoft\Office\*\*\User MRU\*\*
        Recursive: true
        Comment: "MS Office MRU"
    -
        Description: NetworkList
        HiveType: SOFTWARE
        Category: None
        KeyPath: Microsoft\Windows NT\CurrentVersion\NetworkList
        Recursive: true
        Comment: "NetworkList"
    -
        Description: SRUM
        HiveType: SOFTWARE
        Category: Network Activity/Physical Location
        KeyPath: SOFTWARE\Microsoft\WindowsNT\CurrentVersion\SRUM\Extensions{973F5D5C-1D90-4944-BE8E-24B94231A174}
        Recursive: false
        Comment: "SRUM"
    -
        Description: SRUM
        HiveType: SOFTWARE
        Category: Network Activity/Physical Location
        KeyPath: SOFTWARE\Microsoft\Windows NT\CurrentVersion\SRUM\Extensions\{DD6636C4-8929-4683-974E-22C046A43763}
        Recursive: false
        Comment: "SRUM"
    -
        Description: UserAssist
        HiveType: NTUSER
        Category: Execution
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist
        Recursive: true
        Comment: "UserAssist"
# Program Execution -> BAM/DAM
    -
        Description: BAM
        HiveType: SYSTEM
        Category: Program Execution
        KeyPath: ControlSet*\Services\BAM\State\UserSettings\*
        Recursive: false
        Comment: "Displays the last execution time of a program"
    -
        Description: BAM
        HiveType: SYSTEM
        Category: Program Execution
        KeyPath: ControlSet*\Services\BAM\UserSettings\*
        Recursive: false
        Comment: "Displays the last execution time of a program"
    -
        Description: DAM
        HiveType: SYSTEM
        Category: Program Execution
        KeyPath: ControlSet*\Services\DAM\State\UserSettings\*
        Recursive: false
        Comment: "DAM"
    -
        Description: DAM
        HiveType: SYSTEM
        Category: Program Execution
        KeyPath: ControlSet*\Services\DAM\UserSettings\*
        Recursive: false
        Comment: "DAM"
    -
        Description: AppCompatCache
        HiveType: SYSTEM
        Category: Program Execution
        KeyPath: ControlSet00*\Control\Session Manager\AppCompatCache
        ValueName: AppCompatCache
        Recursive: false
        Comment: "AppCompatCache"
    -
        Description: Explorer ComDlg32 LastVisitedPidlMRU
        HiveType: NtUser
        Category: Executables
        KeyPath: Software\Microsoft\Windows\CurrentVersion\Explorer\ComDlg32\LastVisitedPidlMRU
        Recursive: false
        Comment: "LastVisitedPidlMRU"
    -
        Description: SAM
        HiveType: SAM
        Category: User Account
        KeyPath: SAM\Domains\Account\Users
        Recursive: true
        Comment: "SAM"
    -
        Description: TimeZoneInformation
        HiveType: SYSTEM
        Category: Network Activity/Physical Location
        KeyPath: ControlSet001\Control\TimeZoneInformation
        Recursive: true
        Comment: "TimeZoneInformation"