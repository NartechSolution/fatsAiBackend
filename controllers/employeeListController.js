const EmployeeList = require('../models/employeeList');
const prisma = require('../prisma/client');
const path = require('path');
const ExcelJS = require('exceljs');
const fs = require('fs');

// Helper to normalize Excel header names (case/space/underscore insensitive)
const normalizeHeader = (header) => {
  if (!header) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[\s_]/g, '');
};

// Helper to safely parse integer IDs
const parseIntSafe = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
};

// Helper to parse date cells from Excel
const parseDateCell = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && value.text) {
    const d = new Date(value.text);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// Create a new employee
exports.createEmployee = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      departmentId, 
      roleId, 
      jobTitle, 
      status, 
      joiningDate,
      employeeName, // Keeping for backward compatibility
      jobType // Keeping for backward compatibility
    } = req.body;

    // Validate required input
    if (!firstName || !lastName || !email || !jobTitle || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'firstName, lastName, email, jobTitle, and status are required' 
      });
    }

    // Handle image upload
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Prepare employee data
    const employeeData = {
      firstName,
      lastName,
      email,
      jobTitle,
      status,
      ...(imagePath ? { image: imagePath } : {}),
      ...(joiningDate ? { joiningDate: new Date(joiningDate) } : {}),
      ...(departmentId ? { departmentId: Number(departmentId) } : {}),
      ...(roleId ? { roleId: Number(roleId) } : {}),
      ...(employeeName ? { employeeName } : {}),
      ...(jobType ? { jobType } : {}),
    };

    const employee = await EmployeeList.create(employeeData);

    return res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeList.findAll();
    
    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// Bulk import employees from an uploaded Excel/CSV file
// POST /api/employees/import
// Expects multipart/form-data with field: file (XLS/XLSX/CSV)
exports.importEmployeesFromExcel = async (req, res) => {
  let uploadedFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required in "file" field',
      });
    }

    uploadedFilePath = req.file.path;

    const workbook = new ExcelJS.Workbook();
    const ext = path.extname(uploadedFilePath || '').toLowerCase();

    // Support both Excel workbooks and CSV files
    if (ext === '.csv') {
      await workbook.csv.readFile(uploadedFilePath);
    } else {
      await workbook.xlsx.readFile(uploadedFilePath);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: 'No worksheet found in uploaded file',
      });
    }

    // Build header map from first row
    const headerRow = worksheet.getRow(1);
    const headerMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const normalized = normalizeHeader(cell.value);
      if (normalized) {
        headerMap[normalized] = colNumber;
      }
    });

    // Required columns (normalized names)
    const requiredHeaders = [
      'firstname',
      'lastname',
      'email',
      'jobtitle',
      'status',
    ];

    const missingHeaders = requiredHeaders.filter(
      (key) => !headerMap[key]
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required columns in header row. Required (case-insensitive, spaces/underscores ignored): firstName, lastName, email, jobTitle, status',
        missingHeaders,
      });
    }

    const getCellValue = (row, normalizedKey) => {
      const col = headerMap[normalizedKey];
      if (!col) return null;
      const cell = row.getCell(col);
      const value = cell.value;
      if (value && typeof value === 'object' && value.text) {
        return value.text;
      }
      return value;
    };

    // Preload valid foreign key IDs to avoid FK constraint errors
    const [departments, roles] = await Promise.all([
      prisma.department.findMany({ select: { id: true } }),
      prisma.role.findMany({ select: { id: true } }),
    ]);
    const validDepartmentIds = new Set(departments.map((d) => d.id));
    const validRoleIds = new Set(roles.map((r) => r.id));

    const employeesToCreate = [];
    const rowErrors = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const firstName = getCellValue(row, 'firstname');
      const lastName = getCellValue(row, 'lastname');
      const email = getCellValue(row, 'email');
      const jobTitle = getCellValue(row, 'jobtitle');
      const status = getCellValue(row, 'status');

      // Skip completely empty/incomplete rows
      if (!firstName && !lastName && !email) {
        return;
      }

      if (!firstName || !lastName || !email || !jobTitle || !status) {
        // Row missing required fields – skip but record error
        rowErrors.push({
          rowNumber,
          reason: 'Missing required fields (firstName, lastName, email, jobTitle, status)',
        });
        return;
      }

      const departmentId = parseIntSafe(
        getCellValue(row, 'departmentid')
      );
      const roleId = parseIntSafe(
        getCellValue(row, 'roleid')
      );
      const joiningDate = parseDateCell(
        getCellValue(row, 'joiningdate')
      );
      const employeeName = getCellValue(row, 'employeename');
      const jobType = getCellValue(row, 'jobtype');

      // Validate foreign keys
      let rowInvalid = false;
      if (departmentId !== null && !validDepartmentIds.has(departmentId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'departmentId',
          value: departmentId,
          reason: `Department with id ${departmentId} not found`,
        });
      }
      if (roleId !== null && !validRoleIds.has(roleId)) {
        rowInvalid = true;
        rowErrors.push({
          rowNumber,
          field: 'roleId',
          value: roleId,
          reason: `Role with id ${roleId} not found`,
        });
      }

      if (rowInvalid) {
        // Skip this row due to invalid foreign keys
        return;
      }

      const employeeData = {
        firstName,
        lastName,
        email,
        jobTitle,
        status,
        image: null,
        ...(joiningDate ? { joiningDate } : {}),
        ...(departmentId !== null ? { departmentId } : {}),
        ...(roleId !== null ? { roleId } : {}),
        ...(employeeName ? { employeeName } : {}),
        ...(jobType ? { jobType } : {}),
      };

      employeesToCreate.push(employeeData);
    });

    if (employeesToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No valid employee rows found in file. Please ensure required columns are filled and foreign keys are valid.',
        rowErrors,
      });
    }

    const result = await prisma.employeeList.createMany({
      data: employeesToCreate,
    });

    return res.status(201).json({
      success: true,
      message: 'Employees imported successfully from file',
      summary: {
        rowsProcessed: employeesToCreate.length,
        rowsInserted: result.count,
        rowsSkipped: rowErrors.length,
        rowErrors,
      },
    });
  } catch (error) {
    console.error('Error importing employees from file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import employees from file',
      error: error.message,
    });
  } finally {
    if (uploadedFilePath) {
      fs.unlink(uploadedFilePath, () => {});
    }
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await EmployeeList.findById(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      departmentId, 
      roleId, 
      jobTitle, 
      status, 
      joiningDate,
      employeeName, // Keeping for backward compatibility
      jobType // Keeping for backward compatibility
    } = req.body;
    
    // Check if employee exists
    const existingEmployee = await EmployeeList.findById(id);
    
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }
    
    // Handle image upload
    let imagePath = existingEmployee.image;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    
    // Prepare update data
    const updateData = {
      firstName: firstName !== undefined ? firstName : existingEmployee.firstName,
      lastName: lastName !== undefined ? lastName : existingEmployee.lastName,
      email: email !== undefined ? email : existingEmployee.email,
      jobTitle: jobTitle !== undefined ? jobTitle : existingEmployee.jobTitle,
      status: status !== undefined ? status : existingEmployee.status,
      image: imagePath,
      ...(joiningDate !== undefined ? { joiningDate: joiningDate ? new Date(joiningDate) : null } : {}),
      ...(departmentId !== undefined ? { departmentId: departmentId ? Number(departmentId) : null } : {}),
      ...(roleId !== undefined ? { roleId: roleId ? Number(roleId) : null } : {}),
      ...(employeeName !== undefined ? { employeeName } : {}),
      ...(jobType !== undefined ? { jobType } : {}),
    };
    
    // Update employee
    const updatedEmployee = await EmployeeList.update(id, updateData);
    
    return res.status(200).json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const employee = await EmployeeList.findById(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${id} not found`
      });
    }
    
    // Delete employee
    await EmployeeList.delete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
}; 