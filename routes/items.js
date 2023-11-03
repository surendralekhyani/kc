const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const dbConn  = require('../lib/db');

let getMenuOptions = () => {
  return new Promise(async (resolve, reject) => {
      dbConn.query(
        "SELECT userrowid,menuoption FROM userrights ORDER BY userrowid",
        function (err, rows) {
          if (err) {
            reject(err)
          }
          resolve(rows);
        }
      );
  });
}; 

// display page
router.get('/', async function(req, res, next) {  
  try{
    let rowsMenu = await getMenuOptions();
    if(rowsMenu.length>0)
    {
      const nm = req.session.user;
          dbConn.query('SELECT * FROM items WHERE deleted="N" ORDER BY itemRowId desc',function(err,data)     {
              if(err) {
                  req.flash('error', err);
                  res.render('items',{data:''});   
              } else {
                  res.render('items',{'records': rowsMenu, 'data': data });
              }
          });
    }
    else{
      console.log("No Menu Item");
    }
  }
  catch(err){
    req.flash("error", err);
    res.render('items'); 
  }
});

//========================================================================//


// display add page
router.get('/add', async function(req, res, next) {    
  try{
    let rowsMenu = await getMenuOptions();
    if(rowsMenu.length>0)
    {
        res.render('items/add', {
          itemName: '',
          sellingPrice: '',
          pp:'',
          gstRate:'',
          hsn:'',
          records: rowsMenu,
      })
    }
    else{
      console.log("No Menu Item");
    }
  }
  catch(err){
    req.flash("error", err);
    res.render('items'); 
  }
})


let validateInputs = [
    check("itemName", "Name can not be blank...").trim().notEmpty().escape()
  ];

  let checkDuplicate = (itemName, rowId) => {
    return new Promise((resolve, reject) => {
      try {
        if(rowId == 0) // when new record inserting
        {
          var sql = " SELECT * FROM `items` WHERE `itemName` = '" + itemName + "'" 
        }
        else // // when Existing record Updating
        {
          var sql = " SELECT * FROM `items` WHERE `itemName` = '" + itemName + "' AND NOT `itemRowId` = " + rowId 
        }
        dbConn.query(
          sql,
          function (err, rows) {
            if (err) {
              reject(err)
            }
            if (rows.length > 0) {
              resolve(true)
            } else {
              resolve(false)
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  };
  
let createNewRecord = (data) => {
    return new Promise(async (resolve, reject) => {
      // check email is exist or not
      let isDuplicate = await checkDuplicate(data.itemName, 0);
      if (isDuplicate) {
        reject(`This item "${data.itemName}" has already exist.`);
        return;
      } 
      let newRecordData = {
        itemName: data.itemName,
        sellingPrice: data.sellingPrice,
        pp: data.pp,
        gstRate: data.gstRate,
        hsn: data.hsn,
      };
  
        dbConn.query(
          ' INSERT INTO items set ? ', newRecordData,
          function (err, rows) {
            if (err) {
              reject(err)
            }
            resolve("Record Created successfully...");
          }
        );
    });
  };  

// add a new item
router.post('/add', validateInputs, async function(req, res, next) {    
    let errorsArr = [];
    let validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        let errors = Object.values(validationErrors.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        });
        req.flash("error", errorsArr);
        return res.render("items/add", {
            itemName: req.body.itemName,
            sellingPrice: req.body.sellingPrice,
            pp: req.body.pp,
            gstRate: req.body.gstRate,
            hsn: req.body.hsn,
            records: ''
        });
    }

  //create a new item
  let newRecord = {
    itemName: req.body.itemName,
    sellingPrice: req.body.sellingPrice,
    pp: req.body.pp,
    gstRate: req.body.gstRate,
    hsn: req.body.hsn
  };
  try {
    await createNewRecord(newRecord);
    req.flash("success", "Record successfully added");
    return res.redirect("/items");
  } catch (err) {
    console.log(err);
    req.flash("error", "Input Error: " + err);
    res.render("items/add", {
        itemName: req.body.itemName,
        sellingPrice: req.body.sellingPrice,
        pp: req.body.pp,
        gstRate: req.body.gstRate,
        hsn: req.body.hsn,
        records: ''
    });
  }
})



//========================================================================//



// display edit page
router.get('/edit/(:id)', async function(req, res, next) {
  try{
    let rowsMenu = await getMenuOptions();
    if(rowsMenu.length>0)
    {
      let id = req.params.id;
      dbConn.query('SELECT * FROM items WHERE itemRowId = ' + id, function(err, rowsFound, fields) {
          if(err) 
          {
              req.flash('error', 'Record not found with id = ' + RowId)
              res.redirect('/items')
          }
           
          // if Record not found
          if (rowsFound.length <= 0) {
              req.flash('error', 'Record not found with id = ' + RowId)
              res.redirect('/items')
          }
          // if Record found
          else {
              res.render('items/edit', {
                  title: 'Edit Item', 
                  id: rowsFound[0].itemRowId,
                  itemName: rowsFound[0].itemName,
                  sellingPrice: rowsFound[0].sellingPrice,
                  pp: rowsFound[0].pp,
                  gstRate: rowsFound[0].gstRate,
                  hsn: rowsFound[0].hsn,
                  records: rowsMenu,
              })
          }
      }); // End- Select Query
    } // END - if(rowsMenu.length>0)
    else{
      console.log("No Menu Item");
    }
  }
  catch(err){
    req.flash("error", err);
    res.render('items'); 
  }
}); // END- GET



  
let updateRecord = (data, id) => {
  return new Promise( async (resolve, reject) => {
    let isDuplicate = await checkDuplicate(data.itemName, id);
    if (isDuplicate) {
      reject(`This item "${data.itemName}" has already exist.`);
      return;
    } 
    let form_data = {
      itemName: data.itemName,
      sellingPrice: data.sellingPrice,
      pp: data.pp,
      gstRate: data.gstRate,
      hsn: data.hsn,
    };
        // update query
        dbConn.query('UPDATE items SET ? WHERE itemRowId = ' + id, form_data, 
          function(err, result) {
          if (err) {
            reject(err)
          }
          resolve("Record Updated successfully...");
        }
      );
  });
};  

// update data
router.post('/update/:id', validateInputs, async function(req, res, next) {
  let id = req.params.id;
  let errorsArr = [];
    let validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        let errors = Object.values(validationErrors.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        });
        req.flash("error", errorsArr);
        return res.render("items/edit", {
            itemName: req.body.itemName,
            sellingPrice: req.body.sellingPrice,
            pp: req.body.pp,
            gstRate: req.body.gstRate,
            hsn: req.body.hsn,
            records: ''
        });
    }

  //update item
  let recordData = {
    itemName: req.body.itemName,
    sellingPrice: req.body.sellingPrice,
    pp: req.body.pp,
    gstRate: req.body.gstRate,
    hsn: req.body.hsn
  };
  try {
    await updateRecord(recordData, id);
    req.flash("success", "Record successfully updated");
    return res.redirect("/items");
  } catch (err) {
    // console.log(err);
    req.flash("error", "Input Error: " + err);
    res.render("items/edit", {
        id: id,
        itemName: req.body.itemName,
        sellingPrice: req.body.sellingPrice,
        pp: req.body.pp,
        gstRate: req.body.gstRate,
        hsn: req.body.hsn,
        records: ''
    });
  }
    

})



//========================================================================//




// delete user
router.get('/delete/(:id)', function(req, res, next) {
    let id = req.params.id;
    let form_data = {
      deleted: 'Y',
    };
        // update query
        dbConn.query('UPDATE items SET ? WHERE itemRowId = ' + id, form_data, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
            req.flash('error', err)
            // redirect to user page
            res.redirect('/items')
        } else {
            // set flash message
            req.flash('success', 'Record deleted successfully ! ID = ' + id)
            // redirect to user page
            res.redirect('/items')
        }
    })
})

module.exports = router;