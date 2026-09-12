using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;

namespace Hosuni.Windows;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new HosuniContext());
    }
}

internal sealed class HosuniContext : ApplicationContext
{
    private readonly PetForm pet = new();
    private readonly NotifyIcon tray;

    public HosuniContext()
    {
        var menu = new ContextMenuStrip();
        menu.Items.Add("호수니 보이기", null, (_, _) => pet.ShowPet());
        menu.Items.Add("호수니 숨기기", null, (_, _) => pet.Hide());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("호수니 종료", null, (_, _) => ExitThread());
        tray = new NotifyIcon
        {
            Text = "호수니",
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application,
            ContextMenuStrip = menu,
            Visible = true
        };
        tray.DoubleClick += (_, _) => pet.ShowPet();
        pet.ShowPet();
    }

    protected override void ExitThreadCore()
    {
        tray.Visible = false;
        tray.Dispose();
        pet.CloseForExit();
        base.ExitThreadCore();
    }
}

internal sealed class PetForm : Form
{
    private const int WhKeyboardLl = 13;
    private const int WhMouseLl = 14;
    private const int WmKeyDown = 0x0100;
    private const int WmSysKeyDown = 0x0104;
    private const int WmMouseMove = 0x0200;
    private const int WsExTransparent = 0x20;
    private const int WsExToolWindow = 0x80;
    private const int WsExLayered = 0x80000;

    private readonly Dictionary<string, Image[]> frames = new();
    private readonly System.Windows.Forms.Timer animationTimer = new() { Interval = 120 };
    private readonly LowLevelProc keyboardProc;
    private readonly LowLevelProc mouseProc;
    private readonly IntPtr keyboardHook;
    private readonly IntPtr mouseHook;
    private DateTime lastActivity = DateTime.Now;
    private DateTime typingUntil = DateTime.MinValue;
    private DateTime movingUntil = DateTime.MinValue;
    private PointF target;
    private PointF current;
    private string state = "idle";
    private int frameIndex;
    private int tickCount;
    private bool facingLeft;
    private bool exiting;

    public PetForm()
    {
        Width = 192;
        Height = 208;
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        BackColor = Color.Magenta;
        TransparencyKey = Color.Magenta;
        DoubleBuffered = true;
        StartPosition = FormStartPosition.Manual;
        var area = Screen.PrimaryScreen?.WorkingArea ?? new Rectangle(0, 0, 1200, 800);
        Location = new Point(area.Right - Width - 36, area.Bottom - Height - 36);
        current = Location;
        target = current;
        LoadFrames();

        keyboardProc = KeyboardHook;
        mouseProc = MouseHook;
        keyboardHook = SetHook(WhKeyboardLl, keyboardProc);
        mouseHook = SetHook(WhMouseLl, mouseProc);
        animationTimer.Tick += (_, _) => UpdatePet();
        animationTimer.Start();
    }

    protected override CreateParams CreateParams
    {
        get
        {
            var cp = base.CreateParams;
            cp.ExStyle |= WsExTransparent | WsExToolWindow | WsExLayered;
            return cp;
        }
    }

    protected override bool ShowWithoutActivation => true;

    private void LoadFrames()
    {
        foreach (var folder in new[] { "idle", "mouse-follow", "typing-tired", "sleep-recovery" })
        {
            var images = Enumerable.Range(1, 4)
                .Select(number => Path.Combine(AppContext.BaseDirectory, "assets", folder, $"frame-{number:00}.png"))
                .Where(File.Exists)
                .Select(Image.FromFile)
                .ToArray();
            frames[folder] = images;
        }
    }

    private static IntPtr SetHook(int hookId, LowLevelProc callback)
    {
        using var process = Process.GetCurrentProcess();
        using var module = process.MainModule;
        return SetWindowsHookEx(hookId, callback, GetModuleHandle(module?.ModuleName), 0);
    }

    private IntPtr KeyboardHook(int code, IntPtr message, IntPtr data)
    {
        if (code >= 0 && ((int)message == WmKeyDown || (int)message == WmSysKeyDown))
        {
            BeginInvoke(() =>
            {
                lastActivity = DateTime.Now;
                typingUntil = DateTime.Now.AddSeconds(1.4);
            });
        }
        return CallNextHookEx(keyboardHook, code, message, data);
    }

    private IntPtr MouseHook(int code, IntPtr message, IntPtr data)
    {
        if (code >= 0 && (int)message == WmMouseMove)
        {
            var info = Marshal.PtrToStructure<MouseHookInfo>(data);
            BeginInvoke(() => ReceiveMouse(info.Point.X, info.Point.Y));
        }
        return CallNextHookEx(mouseHook, code, message, data);
    }

    private void ReceiveMouse(int x, int y)
    {
        lastActivity = DateTime.Now;
        movingUntil = DateTime.Now.AddSeconds(0.7);
        var area = Screen.FromPoint(new Point(x, y)).WorkingArea;
        target = new PointF(
            Math.Clamp(x + 28, area.Left + 12, area.Right - Width - 12),
            Math.Clamp(y - Height / 2f, area.Top + 12, area.Bottom - Height - 12));
        var delta = target.X - current.X;
        if (delta < -18) facingLeft = true;
        else if (delta > 18) facingLeft = false;
    }

    private void UpdatePet()
    {
        tickCount++;
        var now = DateTime.Now;
        var next = now - lastActivity >= TimeSpan.FromMinutes(2) ? "sleep-recovery"
            : now < typingUntil ? "typing-tired"
            : now < movingUntil ? "mouse-follow"
            : "idle";
        if (next != state)
        {
            state = next;
            frameIndex = 0;
        }
        if (state == "mouse-follow")
        {
            const float damping = 0.14f;
            current = new PointF(current.X + (target.X - current.X) * damping, current.Y + (target.Y - current.Y) * damping);
            if (Math.Abs(target.X - current.X) > 1 || Math.Abs(target.Y - current.Y) > 1)
                Location = Point.Round(current);
        }
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        if (!frames.TryGetValue(state, out var images) || images.Length == 0) return;
        Image image;
        if (state == "sleep-recovery") image = images[^1];
        else if (state == "idle")
        {
            var blink = tickCount % 42;
            image = images[blink is 0 or 1 ? Math.Min(2, images.Length - 1) : 0];
        }
        else
        {
            image = images[frameIndex++ % images.Length];
        }
        e.Graphics.InterpolationMode = InterpolationMode.NearestNeighbor;
        e.Graphics.PixelOffsetMode = PixelOffsetMode.Half;
        if (facingLeft)
        {
            e.Graphics.TranslateTransform(Width, 0);
            e.Graphics.ScaleTransform(-1, 1);
        }
        e.Graphics.DrawImage(image, 0, 0, Width, Height);
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (!exiting)
        {
            e.Cancel = true;
            Hide();
            return;
        }
        animationTimer.Stop();
        if (keyboardHook != IntPtr.Zero) UnhookWindowsHookEx(keyboardHook);
        if (mouseHook != IntPtr.Zero) UnhookWindowsHookEx(mouseHook);
        foreach (var image in frames.Values.SelectMany(value => value)) image.Dispose();
        base.OnFormClosing(e);
    }

    public void ShowPet()
    {
        Show();
        TopMost = true;
    }

    public void CloseForExit()
    {
        exiting = true;
        Close();
    }

    private delegate IntPtr LowLevelProc(int code, IntPtr message, IntPtr data);

    [StructLayout(LayoutKind.Sequential)]
    private struct NativePoint { public int X; public int Y; }

    [StructLayout(LayoutKind.Sequential)]
    private struct MouseHookInfo
    {
        public NativePoint Point;
        public uint MouseData;
        public uint Flags;
        public uint Time;
        public IntPtr ExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int hookId, LowLevelProc callback, IntPtr module, uint threadId);

    [DllImport("user32.dll")]
    private static extern bool UnhookWindowsHookEx(IntPtr hook);

    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hook, int code, IntPtr message, IntPtr data);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string? moduleName);
}

