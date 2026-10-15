using System;
using System.IO;
using System.Diagnostics;
using System.Reflection;
using System.Windows.Forms;

namespace Under40ReportApp
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                // Target directory in user's local application data
                string appDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Under40Report", "app");

                if (!Directory.Exists(appDir))
                {
                    Directory.CreateDirectory(appDir);
                }

                // Extract all embedded files to the local app folder
                ExtractResource("index.html", Path.Combine(appDir, "index.html"));
                ExtractResource("style.css", Path.Combine(appDir, "style.css"));
                ExtractResource("app.js", Path.Combine(appDir, "app.js"));
                ExtractResource("icon.png", Path.Combine(appDir, "icon.png"));
                ExtractResource("app.ico", Path.Combine(appDir, "app.ico"));
                ExtractResource("sample_working_hours.csv", Path.Combine(appDir, "sample_working_hours.csv"));
                ExtractResource("sample_leaves.csv", Path.Combine(appDir, "sample_leaves.csv"));
                ExtractResource("version.json", Path.Combine(appDir, "version.json"));

                string indexFile = Path.Combine(appDir, "index.html");
                string fileUri = "file:///" + indexFile.Replace('\\', '/');

                string profileDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Under40Report", "profile");

                if (!Directory.Exists(profileDir))
                {
                    Directory.CreateDirectory(profileDir);
                }

                // Reset stale Chromium favicon cache so the new app icon renders immediately
                try
                {
                    string favPath = Path.Combine(profileDir, "Default", "Favicons");
                    string favJournal = Path.Combine(profileDir, "Default", "Favicons-journal");
                    if (File.Exists(favPath)) File.Delete(favPath);
                    if (File.Exists(favJournal)) File.Delete(favJournal);
                }
                catch { }

                // Pre-seed Chromium window placement so it opens maximized with title bar visible
                try
                {
                    string defaultDir = Path.Combine(profileDir, "Default");
                    if (!Directory.Exists(defaultDir)) Directory.CreateDirectory(defaultDir);
                    string prefFile = Path.Combine(defaultDir, "Preferences");
                    File.WriteAllText(prefFile, "{\"browser\":{\"window_placement\":{\"fullscreen\":false,\"maximized\":true}}}");
                }
                catch { }

                // Try to launch in standalone desktop app mode with Microsoft Edge or Chrome
                string browserPath = FindBrowserPath();
                if (!string.IsNullOrEmpty(browserPath) && File.Exists(browserPath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = browserPath;
                    // --app= opens as an isolated desktop window with normal title bar
                    // --user-data-dir= isolates from background Edge processes
                    // --start-maximized maximizes window without hiding title bar
                    psi.Arguments = string.Format(
                        "--app=\"{0}\" --user-data-dir=\"{1}\" --start-maximized",
                        fileUri, profileDir);
                    psi.WindowStyle = ProcessWindowStyle.Maximized;
                    psi.UseShellExecute = false;

                    try
                    {
                        Process proc = Process.Start(psi);
                        // Scan for the application window and ensure it is maximized with icon applied
                        string icoPath = Path.Combine(appDir, "app.ico");
                        for (int attempt = 0; attempt < 25; attempt++)
                        {
                            System.Threading.Thread.Sleep(120);
                            bool found = false;
                            EnumWindows(delegate(IntPtr hWnd, IntPtr lParam)
                            {
                                if (IsWindowVisible(hWnd))
                                {
                                    System.Text.StringBuilder sb = new System.Text.StringBuilder(256);
                                    GetWindowText(hWnd, sb, 256);
                                    string title = sb.ToString();
                                    if (title.IndexOf("Under 40 Report", StringComparison.OrdinalIgnoreCase) >= 0)
                                    {
                                        if (File.Exists(icoPath))
                                        {
                                            try
                                            {
                                                IntPtr hSm = LoadImage(IntPtr.Zero, icoPath, IMAGE_ICON, 32, 32, LR_LOADFROMFILE);
                                                IntPtr hLg = LoadImage(IntPtr.Zero, icoPath, IMAGE_ICON, 128, 128, LR_LOADFROMFILE);
                                                if (hSm != IntPtr.Zero) SendMessage(hWnd, WM_SETICON, (IntPtr)ICON_SMALL, hSm);
                                                if (hLg != IntPtr.Zero) SendMessage(hWnd, WM_SETICON, (IntPtr)ICON_BIG, hLg);
                                            }
                                            catch { }
                                        }
                                        ShowWindow(hWnd, SW_MAXIMIZE);
                                        SetForegroundWindow(hWnd);
                                        found = true;
                                        return false;
                                    }
                                }
                                return true;
                            }, IntPtr.Zero);

                            if (found) break;
                        }
                        return;
                    }
                    catch { }
                }

                // Fallback: open directly in the user's default browser (Chrome, Firefox, etc.)
                ProcessStartInfo defaultBrowser = new ProcessStartInfo();
                defaultBrowser.FileName = indexFile;
                defaultBrowser.UseShellExecute = true;
                defaultBrowser.WindowStyle = ProcessWindowStyle.Maximized;
                Process.Start(defaultBrowser);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Could not launch Under 40 Report:\n" + ex.Message, "Under 40 Report", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

        [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Auto, SetLastError = true)]
        private static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Auto)]
        private static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true, CharSet = System.Runtime.InteropServices.CharSet.Auto)]
        private static extern IntPtr LoadImage(IntPtr hinst, string lpszName, uint uType, int cxDesired, int cyDesired, uint fuLoad);

        private const int SW_MAXIMIZE = 3;
        private const uint WM_SETICON = 0x0080;
        private const int ICON_SMALL = 0;
        private const int ICON_BIG = 1;
        private const uint IMAGE_ICON = 1;
        private const uint LR_LOADFROMFILE = 0x00000010;

        static void ExtractResource(string resourceName, string targetPath)
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                string[] names = asm.GetManifestResourceNames();
                string match = null;

                for (int i = 0; i < names.Length; i++)
                {
                    if (names[i].EndsWith(resourceName, StringComparison.OrdinalIgnoreCase))
                    {
                        match = names[i];
                        break;
                    }
                }

                if (match != null)
                {
                    using (Stream s = asm.GetManifestResourceStream(match))
                    {
                        if (s != null)
                        {
                            byte[] buffer = new byte[(int)s.Length];
                            s.Read(buffer, 0, buffer.Length);
                            File.WriteAllBytes(targetPath, buffer);
                        }
                    }
                }
            }
            catch { }
        }

        static string FindBrowserPath()
        {
            string[] possiblePaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google\\Chrome\\Application\\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google\\Chrome\\Application\\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google\\Chrome\\Application\\chrome.exe")
            };

            for (int i = 0; i < possiblePaths.Length; i++)
            {
                if (File.Exists(possiblePaths[i]))
                {
                    return possiblePaths[i];
                }
            }

            return null;
        }
    }
}
