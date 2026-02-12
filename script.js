// Attendance Management System
// Data Storage (In-memory database)
let attendanceDB = {
    courses: [
        { id: 1, code: 'CS101', name: 'Computer Science 101' },
        { id: 2, code: 'MATH201', name: 'Advanced Mathematics' },
        { id: 3, code: 'PHY101', name: 'Physics Fundamentals' },
        { id: 4, code: 'ENG202', name: 'Technical Writing' }
    ],
    
    students: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com' },
        { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com' },
        { id: 5, name: 'Tom Brown', email: 'tom@example.com' },
        { id: 6, name: 'Emily Davis', email: 'emily@example.com' }
    ],
    
    enrollments: [
        { studentId: 1, courseId: 1 },
        { studentId: 2, courseId: 1 },
        { studentId: 3, courseId: 1 },
        { studentId: 4, courseId: 2 },
        { studentId: 5, courseId: 2 },
        { studentId: 6, courseId: 3 },
        { studentId: 1, courseId: 2 },
        { studentId: 2, courseId: 3 }
    ],
    
    attendance: [] // Will store attendance records
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setDefaultDate();
    loadCourses();
    loadStudentsList();
    loadReport();
    loadStudentSelect();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateInput').value = today;
    document.getElementById('reportDateInput').value = today;
}

// Initialize app
function initializeApp() {
    // Load initial data from localStorage if available
    const savedData = localStorage.getItem('attendanceDB');
    if (savedData) {
        attendanceDB = JSON.parse(savedData);
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('attendanceDB', JSON.stringify(attendanceDB));
}

// Load courses into dropdowns
function loadCourses() {
    const courseSelect = document.getElementById('courseSelect');
    const reportCourseSelect = document.getElementById('reportCourseSelect');
    
    courseSelect.innerHTML = '<option value="">-- Choose Course --</option>';
    reportCourseSelect.innerHTML = '<option value="">All Courses</option>';
    
    attendanceDB.courses.forEach(course => {
        courseSelect.innerHTML += `<option value="${course.id}">${course.code} - ${course.name}</option>`;
        reportCourseSelect.innerHTML += `<option value="${course.id}">${course.code} - ${course.name}</option>`;
    });
}

// Load students based on selected course
function loadStudents() {
    const courseId = document.getElementById('courseSelect').value;
    const studentList = document.getElementById('studentList');
    
    if (!courseId) {
        studentList.innerHTML = '<p style="color: #666; text-align: center;">Please select a course first</p>';
        return;
    }
    
    // Get enrolled students for the selected course
    const enrolledStudentIds = attendanceDB.enrollments
        .filter(e => e.courseId == courseId)
        .map(e => e.studentId);
    
    const enrolledStudents = attendanceDB.students
        .filter(s => enrolledStudentIds.includes(s.id));
    
    if (enrolledStudents.length === 0) {
        studentList.innerHTML = '<p style="color: #666; text-align: center;">No students enrolled in this course</p>';
        return;
    }
    
    // Generate student list with attendance controls
    let html = '<h3 style="margin-bottom: 15px;">Enrolled Students</h3>';
    enrolledStudents.forEach((student, index) => {
        const initials = student.name.split(' ').map(n => n[0]).join('');
        
        html += `
            <div class="student-item" id="student-${student.id}">
                <div class="student-info">
                    <div class="student-avatar">${initials}</div>
                    <div>
                        <strong>${student.name}</strong><br>
                        <small>${student.email}</small>
                    </div>
                </div>
                <div class="attendance-controls">
                    <button class="status-btn present ${index === 0 ? 'active' : ''}" 
                            onclick="setAttendanceStatus(${student.id}, 'present', this)">Present</button>
                    <button class="status-btn absent" 
                            onclick="setAttendanceStatus(${student.id}, 'absent', this)">Absent</button>
                    <button class="status-btn late" 
                            onclick="setAttendanceStatus(${student.id}, 'late', this)">Late</button>
                </div>
            </div>
        `;
    });
    
    studentList.innerHTML = html;
    
    // Initialize default status for first student
    if (enrolledStudents.length > 0) {
        setAttendanceStatus(enrolledStudents[0].id, 'present', document.querySelector('.status-btn.present'));
    }
}

// Set attendance status for a student
function setAttendanceStatus(studentId, status, element) {
    const studentItem = document.getElementById(`student-${studentId}`);
    const buttons = studentItem.querySelectorAll('.status-btn');
    
    // Remove active class from all buttons
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('present', 'absent', 'late');
    });
    
    // Add active class to clicked button
    element.classList.add('active');
    element.classList.add(status);
    
    // Store the selected status in the student item
    studentItem.dataset.status = status;
}

// Save attendance for all students
function saveAttendance() {
    const courseId = document.getElementById('courseSelect').value;
    const date = document.getElementById('dateInput').value;
    
    if (!courseId || !date) {
        alert('Please select course and date');
        return;
    }
    
    const studentItems = document.querySelectorAll('.student-item');
    let savedCount = 0;
    
    studentItems.forEach(item => {
        const studentId = item.id.replace('student-', '');
        const status = item.dataset.status || 'present';
        
        // Check if attendance already exists for this student, course, and date
        const existingIndex = attendanceDB.attendance.findIndex(
            a => a.studentId == studentId && a.courseId == courseId && a.date == date
        );
        
        if (existingIndex !== -1) {
            // Update existing record
            attendanceDB.attendance[existingIndex].status = status;
        } else {
            // Add new record
            attendanceDB.attendance.push({
                id: attendanceDB.attendance.length + 1,
                studentId: parseInt(studentId),
                courseId: parseInt(courseId),
                date: date,
                status: status,
                timestamp: new Date().toISOString()
            });
        }
        
        savedCount++;
    });
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Show success message
    alert(`✅ Attendance saved for ${savedCount} students`);
    
    // Refresh report
    loadReport();
}

// Load attendance report
function loadReport() {
    const courseId = document.getElementById('reportCourseSelect').value;
    const date = document.getElementById('reportDateInput').value;
    
    // Filter attendance records
    let filteredAttendance = [...attendanceDB.attendance];
    
    if (courseId) {
        filteredAttendance = filteredAttendance.filter(a => a.courseId == courseId);
    }
    
    if (date) {
        filteredAttendance = filteredAttendance.filter(a => a.date == date);
    }
    
    // Calculate summary
    const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
    const absentCount = filteredAttendance.filter(a => a.status === 'absent').length;
    const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
    const totalCount = filteredAttendance.length;
    
    // Update summary cards
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('absentCount').textContent = absentCount;
    document.getElementById('lateCount').textContent = lateCount;
    document.getElementById('totalCount').textContent = totalCount;
    
    // Generate report table
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (filteredAttendance.length === 0) {
        tableHTML += `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px;">
                    📊 No attendance records found
                </td>
            </tr>
        `;
    } else {
        filteredAttendance.forEach(record => {
            const student = attendanceDB.students.find(s => s.id === record.studentId);
            const course = attendanceDB.courses.find(c => c.id === record.courseId);
            
            let badgeClass = '';
            if (record.status === 'present') badgeClass = 'present-badge';
            else if (record.status === 'absent') badgeClass = 'absent-badge';
            else if (record.status === 'late') badgeClass = 'late-badge';
            
            tableHTML += `
                <tr>
                    <td><strong>${student?.name || 'Unknown'}</strong></td>
                    <td>${course?.code || 'Unknown'}</td>
                    <td>${formatDate(record.date)}</td>
                    <td><span class="${badgeClass}">${record.status.toUpperCase()}</span></td>
                </tr>
            `;
        });
    }
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('reportTable').innerHTML = tableHTML;
}

// Load student select dropdown for performance view
function loadStudentSelect() {
    const studentSelect = document.getElementById('studentSelect');
    studentSelect.innerHTML = '<option value="">-- Choose Student --</option>';
    
    attendanceDB.students.forEach(student => {
        studentSelect.innerHTML += `<option value="${student.id}">${student.name}</option>`;
    });
}

// Load student performance
function loadStudentPerformance() {
    const studentId = document.getElementById('studentSelect').value;
    const performanceChart = document.getElementById('performanceChart');
    
    if (!studentId) {
        performanceChart.innerHTML = '<p style="color: #666; text-align: center;">Select a student to view performance</p>';
        return;
    }
    
    // Get student's enrolled courses
    const enrolledCourses = attendanceDB.enrollments
        .filter(e => e.studentId == studentId)
        .map(e => e.courseId);
    
    const courses = attendanceDB.courses.filter(c => enrolledCourses.includes(c.id));
    
    let chartHTML = '';
    
    courses.forEach(course => {
        // Get attendance records for this student and course
        const attendanceRecords = attendanceDB.attendance.filter(
            a => a.studentId == studentId && a.courseId == course.id
        );
        
        const totalClasses = attendanceRecords.length;
        const presentClasses = attendanceRecords.filter(a => a.status === 'present').length;
        const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : 0;
        
        chartHTML += `
            <div class="chart-card">
                <h4>${course.code} - ${course.name}</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Attendance Rate:</span>
                    <strong style="color: ${attendancePercentage >= 75 ? '#28a745' : '#dc3545'}">
                        ${attendancePercentage}%
                    </strong>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${attendancePercentage}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; color: #666; font-size: 0.9em;">
                    <span>Present: ${presentClasses}</span>
                    <span>Total: ${totalClasses}</span>
                </div>
                <div style="margin-top: 10px; font-size: 0.85em; color: ${attendancePercentage >= 75 ? '#28a745' : '#dc3545'}">
                    ${attendancePercentage >= 75 ? '✅ Meeting requirement' : '⚠️ Below 75% requirement'}
                </div>
            </div>
        `;
    });
    
    if (courses.length === 0) {
        chartHTML = '<p style="color: #666; text-align: center;">Student is not enrolled in any courses</p>';
    }
    
    performanceChart.innerHTML = chartHTML;
}

// Load students list for dropdowns
function loadStudentsList() {
    // This function is called by loadStudents() as needed
}

// Utility function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Add new student
function addStudent(name, email) {
    const newId = attendanceDB.students.length + 1;
    attendanceDB.students.push({
        id: newId,
        name: name,
        email: email
    });
    saveToLocalStorage();
    loadStudentSelect();
}

// Add new course
function addCourse(code, name) {
    const newId = attendanceDB.courses.length + 1;
    attendanceDB.courses.push({
        id: newId,
        code: code,
        name: name
    });
    saveToLocalStorage();
    loadCourses();
}

// Enroll student in course
function enrollStudent(studentId, courseId) {
    // Check if already enrolled
    const existingEnrollment = attendanceDB.enrollments.find(
        e => e.studentId == studentId && e.courseId == courseId
    );
    
    if (!existingEnrollment) {
        attendanceDB.enrollments.push({
            studentId: parseInt(studentId),
            courseId: parseInt(courseId)
        });
        saveToLocalStorage();
        return true;
    }
    return false;
}

// Export attendance report as CSV
function exportReport() {
    const courseId = document.getElementById('reportCourseSelect').value;
    const date = document.getElementById('reportDateInput').value;
    
    let filteredAttendance = [...attendanceDB.attendance];
    
    if (courseId) {
        filteredAttendance = filteredAttendance.filter(a => a.courseId == courseId);
    }
    
    if (date) {
        filteredAttendance = filteredAttendance.filter(a => a.date == date);
    }
    
    // Create CSV content
    let csv = 'Student Name,Email,Course,Date,Status\n';
    
    filteredAttendance.forEach(record => {
        const student = attendanceDB.students.find(s => s.id === record.studentId);
        const course = attendanceDB.courses.find(c => c.id === record.courseId);
        
        csv += `"${student?.name}","${student?.email}","${course?.code}",${record.date},${record.status}\n`;
    });
    
    // Download CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${date || 'all'}.csv`;
    a.click();
}

// Clear all data (for testing)
function clearAllData() {
    if (confirm('Are you sure you want to clear all attendance data?')) {
        attendanceDB.attendance = [];
        saveToLocalStorage();
        loadReport();
        alert('All attendance records cleared');
    }
}